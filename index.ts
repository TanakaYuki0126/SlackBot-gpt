import { App, AwsLambdaReceiver } from "@slack/bolt";
import {
  AwsCallback,
  AwsEvent,
} from "@slack/bolt/dist/receivers/AwsLambdaReceiver";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

if (!process.env.SLACK_SIGNING_SECRET) process.exit(1);

const configration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configration);

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
});

app.event("app_mention", async ({ event, client, context, say }) => {
  if (context.retryNum) {
    console.log(`skipped retry. retryNum: ${context.retryReason}`);
    return;
  }
  try {
    const { channel, event_ts, thread_ts } = event;
    const threadTs = thread_ts ?? event_ts;
    const res = await say({
      channel,
      text: "`system` 処理中.....",
      thread_ts: threadTs,
    });
    const systemTs = res.ts;
    const threadResponse = await client.conversations.replies({
      channel,
      ts: threadTs,
    });
    const chatCompletionRequestMessage: ChatCompletionRequestMessage[] = [];
    threadResponse.messages?.forEach((message) => {
      console.log(message);
      const bot_userid = "U06L202291D";
      const { text, user } = message;
      if (!text) return;
      if (user && user === bot_userid) {
        if (!text.startsWith("`system`")) {
          chatCompletionRequestMessage.push({
            role: "assistant",
            content: text,
          });
        }
      } else {
        chatCompletionRequestMessage.push({
          role: "user",
          content: text.replace(`<@${bot_userid}>`, "") ?? "",
        });
      }
    });

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: chatCompletionRequestMessage,
    });
    const outputText = completion.data.choices
      .map(({ message }) => message?.content)
      .join("");
    await client.chat.postMessage({
      channel,
      text: outputText,
      thread_ts: threadTs,
    });
    if (systemTs) {
      await client.chat.delete({
        channel,
        ts: systemTs,
      });
    }
  } catch (error) {
    console.error(error);
  }
});
module.exports.handler = async (
  event: AwsEvent,
  context: unknown,
  callback: AwsCallback
) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
};
