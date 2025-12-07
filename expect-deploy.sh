#!/usr/bin/expect -f
set timeout 300
set password "YOUR_PASSWORD_HERE"

spawn ssh -o StrictHostKeyChecking=no root@YOUR_SERVER_IP_HERE

expect "password:"
send "$password\r"

expect "# "
send "cd /root/prompthub\r"

expect "# "
send "git fetch origin\r"

expect "# "
send "git reset --hard origin/main\r"

expect "# "
send "npm install\r"

expect "# "
send "npm run build\r"

expect "# "
send "pm2 stop prompthub || true\r"

expect "# "
send "pm2 delete prompthub || true\r"

expect "# "
send "pm2 start ecosystem.config.js\r"

expect "# "
send "pm2 save\r"

expect "# "
send "systemctl restart nginx\r"

expect "# "
send "echo 'Deployment completed successfully!'\r"

expect "# "
send "exit\r"

expect eof
