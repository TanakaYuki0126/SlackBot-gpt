import { App, AwsLambdaReceiver } from "@slack/bolt";
import {
  AwsCallback,
  AwsEvent,
} from "@slack/bolt/dist/receivers/AwsLambdaReceiver";

if (!process.env.SLACK_SIGNING_SECRET) process.exit(1);

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
});

app.event("app_mention", async ({ event, client, context, say }) => {
  try {
    const { channel, event_ts } = event;
    await say({
      channel,
      text: "Hello, world!",
      thread_ts: event_ts,
    });
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
