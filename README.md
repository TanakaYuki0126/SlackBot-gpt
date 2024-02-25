# SlackBOT

## deploy 方法

- `npm run build`
- `zip deploy_package.zip ./dist/bundle.js`
- AWS Lambda でコードをアップロード
- `aws sso login --profile XXX`
- `aws lambda update-function-code --region ap-northeast-1 --function-name SlackBOT --zip-file fileb://deploy_package.zip --profile　XXX`
