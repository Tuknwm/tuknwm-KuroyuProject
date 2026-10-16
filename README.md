<p align="center">
  <img src="https://res.cloudinary.com/ipk905bl/image/upload/f_auto,q_auto/CatLogoWhite" alt="Kuroyu Logo" width="120" />
</p>

# Kuroyu — E-Commerce Platform

> Full-stack MERN e-commerce platform for a Japanese streetwear brand. Features AI chat, Google OAuth, real-time order tracking, flash sales, and a complete admin dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4, GSAP, Lenis, React Router DOM v7 |
| Backend | Node.js, Express 5, MVC pattern |
| Database | MongoDB Atlas, Mongoose ODM |
| Auth | JWT, bcrypt, Google OAuth 2.0 |
| AI | Groq SDK (LLaMA 3) |
| Email | Nodemailer, React Email |
| Map | Leaflet (OpenStreetMap) |
| Upload | Multer |

---

## Features

- Product catalogue with search, filter, and sort
- Flash sale section with countdown timer
- Google OAuth 2.0 one-tap login
- AI chat assistant (Groq / LLaMA 3) for product Q&A
- Real-time order tracking with timestamped shipping log
- Confirmation emails via Gmail SMTP
- Multi-image product upload
- Admin dashboard — products, orders, users, categories, site settings
- SSE real-time notifications

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account
- Google Cloud OAuth 2.0 Client ID
- Groq API key
- Gmail app password

### Installation

```bash
git clone https://github.com/<your-username>/kuroyu.git
cd kuroyu
```

**Backend:**
```bash
cd Server
npm install
```

Create `Server/.env`:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/kuroyu
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GROQ_API_KEY=your_groq_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
PORT=5000
```

**Frontend:**
```bash
cd ../Client
npm install
```

Create `Client/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### Running

```bash
# Backend
cd Server && npm run dev

# Frontend (new terminal)
cd Client && npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## API Overview

| Group | Base Path |
|-------|-----------|
| Auth | `/api/auth` |
| Products | `/api/products` |
| Orders | `/api/orders` |
| Cart | `/api/cart` |
| Users | `/api/users` |
| Admin | `/api/admin` |
| Chat | `/api/chat` |
| Categories | `/api/categories` |
| Notifications | `/api/notifications` |

Full API documentation in `Project Documentation/FSD_Documentation_Filled.docx`.

---

## Folder Structure

```
kuroyu/
├── Client/          # React 19 frontend (Vite)
│   ├── public/      # Static assets
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       └── pages/
└── Server/          # Express 5 backend
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── emails/
    └── utils/
```

---

## License

MIT
