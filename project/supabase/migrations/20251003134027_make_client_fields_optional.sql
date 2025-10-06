/*
  # Make client fields optional

  1. Changes
    - Make email, telephone, code_postal, rue, and ville fields optional (nullable)
    - These fields can now be empty or filled later
    - nom, prenom, and nom_entreprise remain required
*/

ALTER TABLE clients ALTER COLUMN email DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN telephone DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN code_postal DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN rue DROP NOT NULL;
ALTER TABLE clients ALTER COLUMN ville DROP NOT NULL;

-- Set default empty strings for optional fields
ALTER TABLE clients ALTER COLUMN email SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN telephone SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN code_postal SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN rue SET DEFAULT '';
ALTER TABLE clients ALTER COLUMN ville SET DEFAULT '';