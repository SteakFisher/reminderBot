`SELECT * FROM users WHERE userId = '${interaction.user.id}'`
`
INSERT INTO reminders (messageId, guildId, title, startDate, endDate) VALUES ('${embedMessage.id}', '${guild.id}', '${title}', '${startTimeTemp}', '${endTimeTemp}')`

"CREATE DATABASE IF NOT EXISTS reminderBot"

"USE reminderBot"

"CREATE TABLE IF NOT EXISTS reminders (id INT AUTO_INCREMENT PRIMARY KEY, messageId VARCHAR(30) UNIQUE, guildId VARCHAR(30), title varchar(255), startDate DATETIME, endDate DATETIME)

CREATE TABLE IF NOT EXISTS users (userId VARCHAR(30) PRIMARY KEY, access_token VARCHAR(255), refresh_token VARCHAR(255), expiry_date BIGINT)"

DELETE FROM users WHERE userId = '${interaction.user.id}'`

`SELECT access_token FROM users WHERE userId = '${interaction.user.id}'`

`SELECT * FROM reminders WHERE messageId = '${interaction.message.id}

`INSERT INTO users (userId, access_token, refresh_token, expiry_date) VALUES ('${interaction.user.id}', '${r[0].tokens.access_token}', '${r[0].tokens.refresh_token}', ${r[0].tokens.expiry_date})`

`DELETE FROM users WHERE userId = '${interaction.user.id}'`