# 🐝 JobHive - Complete Job Portal

## 📁 Project Structure
```
jobportal/
├── index.html          → Main website (5 pages)
├── css/
│   └── style.css       → Complete stylesheet
├── js/
│   └── main.js         → Frontend JavaScript
├── php/
│   ├── config.php      → Database config
│   └── api.php         → Backend API (all AJAX calls)
├── database.sql        → MySQL database schema + sample data
└── README.md           → Ye file
```

## 🚀 Setup Kaise Karein (Step by Step)

### Step 1: XAMPP/WAMP Install Karo
- Download karo: https://www.apachefriends.org/
- Install karo aur Apache + MySQL start karo

### Step 2: Files Copy Karo
```
jobportal/ folder ko copy karo:
C:\xampp\htdocs\jobportal\   (XAMPP)
ya
C:\wamp64\www\jobportal\     (WAMP)
```

### Step 3: Database Setup Karo
1. Browser mein kholo: http://localhost/phpmyadmin
2. Left panel mein "New" click karo
3. Database name: `job_portal` → Create
4. Import tab click karo
5. `database.sql` file select karo → Go

### Step 4: Config Update Karo
`php/config.php` mein apna MySQL password daalo:
```php
define('DB_USER', 'root');    // apna username
define('DB_PASS', '');        // apna password (XAMPP mein usually blank)
```

### Step 5: Website Kholo
Browser mein: http://localhost/jobportal

---

## 👤 Demo Login Credentials

### Admin Login
- Email: `admin@jobportal.com`  
- Password: `password`

### Employer Login  
- Email: `employer@techcorp.com`
- Password: `password`

### Naya Account Banana
- Website pe Register button click karo

---

## 📄 5 Pages

| Page | Description |
|------|-------------|
| 🏠 **Home** | Hero, Categories, Featured Jobs, How it Works, Testimonials, CTA |
| 💼 **Browse Jobs** | Search + Filters + Job Cards grid + Load More |
| 📋 **Job Detail** | Full job info + Apply button + Company info |
| ℹ️ **About Us** | Mission, Values, Team section |
| 📞 **Contact** | Contact form + Info |
| 📊 **Dashboard** | Role-based (Admin/Employer/Seeker) |

---

## ✨ Features List

### Frontend Features
- ✅ Responsive design (mobile friendly)
- ✅ Animated hero section with floating cards
- ✅ Real-time job search with filters
- ✅ Category filter
- ✅ Job type, Work mode, Experience filter
- ✅ Featured jobs highlighting
- ✅ Save/Bookmark jobs
- ✅ Load more pagination
- ✅ Toast notifications
- ✅ Modal dialogs (Login, Register, Apply)
- ✅ Animated counters
- ✅ Smooth navigation (SPA-style)

### Backend Features (PHP + MySQL)
- ✅ User Registration & Login
- ✅ Role-based access (Admin/Employer/Seeker)
- ✅ Password hashing (bcrypt)
- ✅ Job CRUD operations
- ✅ Job applications system
- ✅ Application status tracking
- ✅ Save/unsave jobs
- ✅ Contact form
- ✅ Dashboard with stats

### Database Tables
- `users` - Job seekers, employers, admins
- `companies` - Company profiles
- `categories` - Job categories
- `jobs` - Job listings
- `applications` - Job applications
- `saved_jobs` - Bookmarked jobs
- `contact_messages` - Contact form

---

## 🎨 Design Features
- Font: Syne (Display) + DM Sans (Body)
- Colors: Orange (#FF6B35) + Dark Navy + Teal accent
- Glassmorphism navbar
- Gradient hero section
- Card hover effects
- Smooth animations

---

## 🔧 Customization

### Apna Color Change Karna
`css/style.css` mein `:root` section mein:
```css
--primary: #FF6B35;  /* Apna color yahan */
--accent: #00D4AA;   /* Accent color */
```

### Site Name Change Karna
`php/config.php` mein:
```php
define('SITE_NAME', 'Your Portal Name');
```

---

Banaya gaya: JobHive Team 🐝
