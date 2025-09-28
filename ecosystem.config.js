module.exports = {
  apps: [{
    name: 'prompthub',
    cwd: '/root/prompthub',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    env: {
      NODE_ENV: 'production',
      PORT: '3000',
      NEXTAUTH_URL: 'https://prompt-hub.site',
      NEXTAUTH_SECRET: 'An5P5m5ZJ1iW2/xIOLlkdKoyEClqsM3oYyzeHIofR8g=',
      IMPERSONATION_SECRET: 'An5P5m5ZJ1iW2/xIOLlkdKoyEClqsM3oYyzeHIofR8g=',
      GOOGLE_CLIENT_ID: '1006488933068-254ejautlqm2o22rnlqct6rj1167p3sb.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: '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',
      REDIS_URL: 'redis://127.0.0.1:6379'
    },
    autorestart: true,
    max_restarts: 10
  }]
};
