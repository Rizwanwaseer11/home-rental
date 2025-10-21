🏠 HOME RENTAL SYSTEM
=========================

A complete dynamic Node.js web application where property owners can list their houses for rent, 
and renters can book properties, send booking requests, receive notifications and emails, 
and manage their orders through a secure dashboard.

Built with:
- Node.js
- Express.js
- MongoDB (Mongoose)
- EJS templating engine
- Express-Session authentication
- Nodemailer for email notifications

-------------------------------------
🚀 FEATURES
-------------------------------------
✅ User Authentication (Login, Signup, Reset Password via Email)
✅ Role-based Access (Owner & Renter)
✅ Add / Edit / Delete Property Listings
✅ Booking Requests (Send, Approve, Reject, Cancel)
✅ Real-time Notifications
✅ Email Alerts using Nodemailer (for booking, approval, rejection, and cancellation)
✅ Secure session handling
✅ Rate limiting for security
✅ Clean responsive EJS UI with Bootstrap

-------------------------------------
🛠️ INSTALLATION & SETUP
-------------------------------------

1️⃣ Clone the repository
-------------------------
git clone https://github.com/Rizwanwaseer11/homerental.git
cd home-rent

2️⃣ Install dependencies
-------------------------
npm install

3️⃣ Create a `.env` file in the project root
--------------------------------------------

4️⃣ Run the server
-------------------------
npm start

Server will run by default at:
👉 http://localhost:5000

-------------------------------------
📁 PROJECT STRUCTURE
-------------------------------------

home-rent/
│
├── models/
│   ├── user.js
│   ├── property.js
│   ├── booking.js
│   └── notification.js
│
├── routes/
│   ├── authRoutes.js
│   ├── propertyRoutes.js
│   ├── ordersRoutes.js
│   ├── notificationRoutes.js
│   └── messageRoutes.js
│
├── middlewares/
│   ├── auth.js
│   └── rateLimit.js
│
├── views/
│   ├── layouts/
│   ├── partials/
│   ├── properties/
│   ├── bookings/
│   ├── notifications/
│   └── auth/
│
├── public/
│   ├── css/
│   ├── js/
│   └── images/
│
├── app.js
├── package.json
└── README.txt

-------------------------------------
📬 EMAIL NOTIFICATIONS
-------------------------------------
The app uses **Nodemailer** to send automatic emails for:
- New booking requests
- Booking approvals/rejections
- Booking cancellations

Emails are sent via your configured email in `.env`.

-------------------------------------
👥 USER ROLES
-------------------------------------

🏡 OWNER:
- Can add/edit/delete properties
- Receives email and notifications when renters request bookings
- Can approve or reject booking requests

👤 RENTER:
- Can view all properties
- Can send booking requests
- Receives notifications and emails on booking approval/rejection/cancellation

-------------------------------------
🧠 SECURITY & BEST PRACTICES
-------------------------------------
- CSRF Protection (if enabled)
- Express-helmet
- Express Rate Limiter
- Session-based authentication
- Bodyparser
- Morgan
- Cookie-Parser
- Mehod-Override
- MongoDB input validation
- Passwords hashed using bcrypt

-------------------------------------
🧩 HOW TO DEPLOY
-------------------------------------
You can easily deploy this project on:
- Render.com
- Railway.app
- Cyclic.sh

Just connect your GitHub repo and add the required `.env` variables in their dashboard.

-------------------------------------
🧾 LICENSE
-------------------------------------
This project is open-source under the MIT License.
Feel free to use and modify it as per your needs.

-------------------------------------
💡 CONTRIBUTIONS
-------------------------------------
Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

-------------------------------------
👨‍💻 AUTHOR
-------------------------------------
Developed by: [Rizwan Ahmed Waseer]
Contact: [Email: rizwanwaseer98@gmail.com , Github: https://github.com/Rizwanwaseer11 ]

