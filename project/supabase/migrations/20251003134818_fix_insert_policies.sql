/*
  # Fix INSERT policies for clients and orders

  1. Changes
    - Drop existing INSERT policies that are missing WITH CHECK
    - Recreate INSERT policies with proper WITH CHECK clauses
    - Ensure user_id matches authenticated user on insert
*/

-- Fix clients INSERT policy
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix orders INSERT policy
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);