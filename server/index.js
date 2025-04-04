// server/index.js (ESM version with EntitySchema)
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pg from 'pg';
import dotenv from 'dotenv';
import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource } from '@adminjs/typeorm';
import { DataSource, EntitySchema } from 'typeorm';
import 'reflect-metadata';

dotenv.config();
const { Pool } = pg;
const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

//  ОБЯЗАТЕЛЬНО! Зарегистрировать адаптер TypeORM для AdminJS
AdminJS.registerAdapter({ Database, Resource });

// ✅ Booking entity (через EntitySchema без декораторов)
const BookingEntity = new EntitySchema({
  name: 'Booking',
  tableName: 'bookings',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    from_location: { type: String },
    to_location: { type: String },
    datetime: { type: 'timestamp' },
    passengers: { type: Number },
    luggage: { type: String },
    flight: { type: String },
    car_type: { type: String },
    price: { type: 'numeric' },
    baby_seat: { type: Boolean, default: false },
    comment: { type: String },
    created_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
  },
});

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: [BookingEntity],
  synchronize: false,
});

async function runAdminPanel() {
  await dataSource.initialize();

  const admin = new AdminJS({
    resources: [
      {
        resource: Resource,
        options: {
          model: dataSource.getRepository(BookingEntity), // Использовать getRepository здесь
        },
      },
    ],
    rootPath: '/admin',
    branding: {
      companyName: 'LuxTransfer Admin',
      softwareBrothers: false,
    },
  });

  const adminRouter = AdminJSExpress.buildRouter(admin);
  app.use(admin.options.rootPath, adminRouter);
}

runAdminPanel().catch(console.error);

// API route for receiving bookings
app.post('/booking', async (req, res) => {
  try {
    const {
      name, email, phone, from, to, datetime,
      passengers, luggage, flight, carType,
      price, babySeat, comment,
    } = req.body;

    await pool.query(
      `INSERT INTO bookings
        (name, email, phone, from_location, to_location, datetime,
          passengers, luggage, flight, car_type, price, baby_seat, comment)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [name, email, phone, from, to, datetime, passengers, luggage, flight, carType, price, babySeat || false, comment]
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}/admin`);
});