/*
  # Create Clients and Orders Management System

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `nom` (text) - Last name
      - `prenom` (text) - First name
      - `nom_entreprise` (text) - Company name
      - `email` (text) - Email address
      - `telephone` (text) - Phone number
      - `code_postal` (text) - Postal code
      - `rue` (text) - Street address
      - `ville` (text) - City
      - `created_at` (timestamptz) - Creation timestamp
      - `user_id` (uuid) - Reference to auth user

    - `orders`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `order_number` (text) - Optional order number
      - `week_number` (integer) - Week number of the order
      - `year` (integer) - Year of the order
      - `delivery_week` (integer) - Delivery week
      - `delivery_year` (integer) - Delivery year
      - `day_of_week` (text) - Day of the week
      - `closure_days` (text[]) - Array of closure days
      - `delivery_instructions` (text) - Delivery instructions
      - `products` (jsonb) - Products in the order
      - `total` (numeric) - Total order amount
      - `created_at` (timestamptz) - Creation timestamp
      - `user_id` (uuid) - Reference to auth user

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Users can only access their own clients and orders
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  nom_entreprise text NOT NULL,
  email text NOT NULL,
  telephone text NOT NULL,
  code_postal text NOT NULL,
  rue text NOT NULL,
  ville text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  order_number text,
  week_number integer NOT NULL,
  year integer NOT NULL,
  delivery_week integer,
  delivery_year integer,
  day_of_week text,
  closure_days text[],
  delivery_instructions text,
  products jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_year_week ON orders(year DESC, week_number DESC);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for orders table
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);