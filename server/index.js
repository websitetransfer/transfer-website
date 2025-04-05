// server/index.js (Express + PostgreSQL only)
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Мидлвары
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

// API маршрут для приёма заказов
app.post('/booking', async (req, res) => {
  try {
    console.log('🛬 Пришёл заказ:', req.body); // лог для отладки

    const {
      name, email, phone, from, to, datetime,
      passengers, luggage, flight, carType,
      price, babySeat, comment,
    } = req.body;

    // 💡 Проверь, все ли поля приходят
    if (!name || !phone || !from || !to || !datetime) {
      return res.status(400).json({ success: false, error: 'Некоторые поля отсутствуют' });
    }

    await pool.query(
      `INSERT INTO bookings
        (name, email, phone, from_location, to_location, datetime,
          passengers, luggage, flight, car_type, price, baby_seat, comment)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        name, email, phone, from, to, datetime,
        passengers, luggage, flight, carType,
        price, babySeat || false, comment,
      ]
    );

    console.log('✅ Заказ успешно сохранён в базу');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Ошибка при бронировании:', err.message);
    res.status(500).json({ success: false, error: 'Ошибка на сервере' });
  }
});
