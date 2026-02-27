# 💬 Real-Time Chat Application (Frontend)

A modern real-time chat application built using **React + Vite** with **Socket.IO** for instant messaging. This frontend connects to a Node.js backend to provide seamless real-time communication between users.

---

## 🚀 Features

* 🔐 User Authentication (Login)
* 💬 Real-time messaging using Socket.IO
* 👥 User list with search functionality
* 🟢 Online/Offline status indicator
* 📩 Optimistic UI updates (instant message display)
* 🕒 Message timestamps & date grouping
* 📱 Responsive and clean UI
* 🔄 Auto-scroll to latest messages
* 🚪 Logout functionality

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite)
* **State Management:** React Hooks
* **HTTP Client:** Axios
* **Real-Time:** Socket.IO Client
* **Routing:** React Router DOM
* **Styling:** CSS

---

## 📁 Project Structure

```
realtimechatapplication-frontend/
│── public/
│── src/
│   ├── api/          # API calls (Axios setup)
│   ├── components/   # Reusable UI components
│   ├── pages/        # Login & Chat pages
│   ├── socket/       # Socket.IO configuration
│   ├── App.jsx       # Main routing
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
│── package.json
│── vite.config.js
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```
VITE_API_URL=https://your-backend-url.onrender.com
```

---

## 📦 Installation

```bash
git clone https://github.com/your-username/realtimechatapplication-frontend.git
cd realtimechatapplication-frontend
npm install
```

---

## ▶️ Run Locally

```bash
npm run dev
```

App will run on:

```
http://localhost:5173
```

---

## 🏗️ Build for Production

```bash
npm run build
```

---

## 🌐 Deployment

### Vercel (Recommended)

* Framework: **Vite**
* Build Command:

```
npm run build
```

* Output Directory:

```
dist
```

---

## 🔗 Backend Repository

👉 Make sure backend is running and deployed
(Example: Node.js + Express + Socket.IO)

---

## ⚡ Important Notes

* Ensure backend URL is correctly set in `.env`
* Socket connection uses JWT authentication
* CORS must be enabled in backend for frontend URL
* Case-sensitive file imports are important for deployment

---

## 📸 Screenshots

* Login Page
* Chat Interface
* Real-time Messaging

*(Add screenshots here if needed)*

---

## 👨‍💻 Author

**Sathwik Raja**

* GitHub: https://github.com/SathwikGoud12

---

## ⭐ If you like this project

Give it a ⭐ on GitHub and share it!

---
