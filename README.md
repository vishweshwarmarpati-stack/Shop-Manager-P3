# 🍿 SnackFlow

> A modern multi-shop snack shop management and POS platform.

SnackFlow is a full-stack web application designed to help snack shop owners manage multiple shops, products, workers, orders, salaries, and sales analytics from a single platform.

The system provides separate access for administrators and cashiers while keeping shop-level data isolated.

---

## 🚀 Live Application

### Frontend
https://shop-manager-p3.vercel.app

### Backend API
https://snackflow-backend-aia5.onrender.com

### API Documentation
https://snackflow-backend-aia5.onrender.com/docs

---

## ✨ Features

### 🔐 Authentication & Authorization

- Secure login system
- JWT-based authentication
- Password hashing
- Role-based access control
- Administrator and cashier roles
- Active/inactive user management
- Shop-specific cashier access
- Protected backend API endpoints

### 🏪 Multi-Shop Management

- Create and manage multiple shops
- Each shop can have its own:
  - Products
  - Workers
  - Orders
  - Cashiers
- Administrators can access all shops
- Cashiers can access only their assigned shop

### 📦 Product Management

- Add products
- Edit products
- Delete products
- Activate/deactivate products
- Assign products to specific shops
- Shop-level product isolation

### 🛒 POS System

- Product-based point-of-sale interface
- Add products to cart
- Increase/decrease quantities
- Automatic subtotal calculation
- Automatic total calculation
- Payment method selection
- Order creation

### 🧾 Order Management

- Store completed orders
- View order history
- View individual orders
- Track payment methods
- Shop-specific order access

### 👷 Worker Management

- Add workers
- Assign workers to shops
- Update worker information
- Activate/deactivate workers
- Manage worker salary information

### 💰 Salary Management

- Record salary payments
- Track payment month
- Track payment method
- Store payment notes
- View worker salary payment history
- Delete salary payment records

### 📊 Analytics

- Sales statistics
- Order statistics
- Revenue information
- Shop-based analysis
- Dashboard statistics

### 👥 User Management

Administrators can:

- Create users
- Edit users
- Assign cashier accounts to shops
- Change roles
- Activate/deactivate users
- Delete users
- View user status

---

# 🏗️ Architecture

```text
                         SnackFlow
                             │
              ┌──────────────┴──────────────┐
              │                             │
          Frontend                       Backend
       React + TypeScript                 FastAPI
              │                             │
              │          REST API            │
              └──────────────►──────────────┘
                                            │
                                            ▼
                                      PostgreSQL
