const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const token = '8225947354:AAFmNSyAJCtalC2SA-2_vHE2CBBM4uTzlzo'; // BotFather tokeningiz
const ADMIN_ID = 1354799500; // Sizning Telegram IDingiz

const bot = new TelegramBot(token, { polling: true });

let drivers = [];

// ================== USERS LOAD ==================
if (fs.existsSync('users.json')) {
    drivers = JSON.parse(fs.readFileSync('users.json'));
}

const saveDrivers = () => {
    fs.writeFileSync('users.json', JSON.stringify(drivers, null, 2));
};

// ================== START COMMAND ==================
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const existing = drivers.find(d => d.userId === chatId);

    if (existing) {
        bot.sendMessage(chatId, "Siz allaqachon ro'yxatdasiz ✅");
        return;
    }

    bot.sendMessage(chatId, "Iltimos, ism familiyangizni kiriting:");
});

// ================== ISM QABUL QILISH ==================
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Rasm bo'lsa, /start bo'lsa e'tibor bermaydi
    if (msg.photo || msg.text === '/start') return;

    const existing = drivers.find(d => d.userId === chatId);

    if (!existing) {
        if (!msg.text || msg.text.trim().length === 0) {
            bot.sendMessage(chatId, "Iltimos, to'g'ri ism familiya kiriting.");
            return;
        }

        drivers.push({
            userId: chatId,
            fullName: msg.text.trim()
        });

        saveDrivers();

        bot.sendMessage(chatId, "Siz ro'yxatga qo'shildingiz ✅");
    }
});

// ================== HAR KUNI MOUNTAIN TIME 6:00 DA XABAR ==================
cron.schedule('0 6 * * *', () => {
    drivers.forEach(driver => {
        try {
            bot.sendMessage(driver.userId, "Iltimos, bugungi odometer rasmni yuboring 📷");
        } catch (e) {
            console.error("Xatolik xabar yuborishda:", e);
        }
    });
}, {
    timezone: "America/Denver" // MST/MDT avtomatik aniqlaydi
});

// ================== RASM QABUL QILISH ==================
bot.on('photo', (msg) => {
    const userId = msg.from.id;
    const driver = drivers.find(d => d.userId === userId);

    if (!driver) return; // ro'yxatda bo'lmasa e'tibor bermaydi

    const photoId = msg.photo[msg.photo.length - 1].file_id;

    try {
        // Adminga yuborish
        bot.sendPhoto(ADMIN_ID, photoId, {
            caption: `Driver: ${driver.fullName}\nUserID: ${driver.userId}`
        });

        // Foydalanuvchiga tasdiqlash
        bot.sendMessage(userId, "Rasmingiz adminga yuborildi ✅");
    } catch (e) {
        console.error("Xatolik rasm yuborishda:", e);
        bot.sendMessage(userId, "Rasm yuborishda xatolik yuz berdi ❌");
    }
});

console.log("Bot ishga tushdi...");