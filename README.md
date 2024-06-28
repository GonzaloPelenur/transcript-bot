# TRANSCRIPT-BOT

This Slack bot listents to `file_share` events on a Slack channel that it's added to. If a user uploads an audio file or a pdf file, the bot transcribes the file and returns a .txt file with the transcription back to the user on the same channel.

## Set up Slack API

Create a Slack bot with a modified version of this manifest

```yaml
display_information:
    name: transcript-bot
features:
    bot_user:
        display_name: transcript-bot
        always_online: false
oauth_config:
    scopes:
        bot:
            - channels:history
            - channels:read
            - chat:write
            - commands
            - files:read
            - groups:history
            - im:history
            - mpim:history
            - files:write
settings:
    event_subscriptions:
        request_url: https://9f29-65-112-8-17.ngrok-free.app/slack/events
        bot_events:
            - file_shared
    org_deploy_enabled: false
    socket_mode_enabled: false
    token_rotation_enabled: false
```

## Run locally

Create a .env file with the following variables:

```bash
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
SLACK_APP_TOKEN=

OPENAI_API_KEY=
```

Install node modules and start server:

```bash
npm install
npm start
```

Run a tunnel to expose the local server to the internet:

```bash
ngrok http 3000
```

Copy the ngrok URL and paste it in the Slack API event subscriptions request URL. Remember to add /slack/events at the end of the URL. For example `https://9f29-65-112-8-17.ngrok-free.app/slack/events`.
