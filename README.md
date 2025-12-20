# **Lapore-Capital App**

A **decentralized banking prototype** focused on **crypto integration**, built with **React + TypeScript** and **Supabase**.

This repository currently implements the **core authentication flow** (login and create account) connected directly to the database. The rest of the app (dashboard, wallet, transactions) will be implemented later.

The design uses **Ethereum-inspired blue** for accents, **dark mode** as the main theme, and is **mobile-first responsive**.

---

## **Table of Contents**

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Getting Started](#getting-started)
4. [Database Setup](#database-setup)
5. [Design & Theme](#design--theme)
6. [Next Steps](#next-steps)
7. [Documentation & Notes](#documentation--notes)

---

## **Features**

* **User Authentication**

  * Email/password login
  * Registration with Full Name and Username
* **Database-Connected**

  * Directly uses Supabase for authentication and `profiles` table
  * No mock data
* **Responsive & Mobile-First Design**

  * Works seamlessly on mobile devices
* **Dark Mode & Ethereum Blue Theme**

  * Dark backgrounds with light text
  * Primary accent color: Ethereum Blue (#3C3CFF)

---

## **Project Structure**

```
/frontend
  /src
    /components
      AuthForm.tsx         # Login & Register form
    /pages
      AuthPage.tsx         # Main authentication page
    /lib
      supabase.ts          # Supabase client configuration
```

* **supabase.ts:** Contains the Supabase URL and anon key to connect to your project.
* **AuthForm.tsx:** Handles login/register form and database interaction.
* **AuthPage.tsx:** Renders the authentication page and form toggle.

---

## **Getting Started**

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lapore-capital.git
cd lapore-capital/frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create `.env` file in `/frontend/src/lib`:

```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server:

```bash
npm start
# or
yarn start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.
6. Test login and create account.

---

## **Database Setup**

1. Create a **Supabase project** at [supabase.com](https://supabase.com).
2. Enable **Authentication → Email & Password**.
3. Create `profiles` table:

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  username text unique,
  created_at timestamp with time zone default now()
);
```

* `id` must match the Supabase Auth user ID.
* `full_name` and `username` are required for registration.

---

## **Design & Theme**

* **Primary Color:** Ethereum Blue (#3C3CFF)
* **Dark Mode:** Dark backgrounds (#121212) with light text (#FFFFFF)
* **Mobile-First:** Components designed to scale from small screens up

**Note:** The design layout is based on the attached design file (copy/paste or reference from attachment).

---

## **Next Steps**

* Implement **dashboard page** to show user info
* Add **wallet system** for fiat/crypto balances
* Integrate **blockchain features** (crypto deposit/withdraw)
* Expand **UI components** to match full design

---

## **Documentation & Notes**

* Every function in `/components/AuthForm.tsx` is documented with comments.
* Supabase client setup is centralized in `/lib/supabase.ts`.
* All state is handled using React Hooks.
* No mock data is used—everything interacts with the database directly.

---

> **Important:** This is the **first phase of Lapore-Capital**, focused solely on working authentication and database connectivity. Everything else will be built iteratively.

