/*
  # Create Inspiration Module

  1. New Tables
    - `inspiration_categories`
      - Defines categories and subcategories dynamically per profession
      - Links categories to specific profession types
      - Controls visibility rules
    
    - `inspirations`
      - Main inspirations content (images/videos)
      - Links to profession types and categories
      - Season and mood filters
      - User interaction tracking (saved, added to feed, scheduled)
    
    - `user_saved_inspirations`
      - Tracks user favorites/saved inspirations
      - Allows personal collections
  
  2. Security
    - Enable RLS on all tables
    - Users can view all inspirations
    - Users can manage their own saved inspirations
  
  3. Features
    - Dynamic categories per profession
    - Season and mood filtering
    - Integration with content calendar
    - Visual-first approach
*/

-- Create inspiration categories table
CREATE TABLE IF NOT EXISTS inspiration_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_type text NOT NULL,
  category_key text NOT NULL,
  category_label text NOT NULL,
  subcategory_key text,
  subcategory_label text,
  display_order int DEFAULT 0,
  is_common boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(profession_type, category_key, subcategory_key)
);

-- Create inspirations table
CREATE TABLE IF NOT EXISTS inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profession_type text NOT NULL,
  category_key text NOT NULL,
  subcategory_key text,
  title text,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'photo' CHECK (media_type IN ('photo', 'video')),
  season text CHECK (season IN ('winter', 'spring', 'summer', 'autumn')),
  mood text CHECK (mood IN ('soft', 'intense', 'natural', 'glam', 'luxe', 'clean', 'girly', 'bold')),
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user saved inspirations table
CREATE TABLE IF NOT EXISTS user_saved_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inspiration_id uuid REFERENCES inspirations(id) ON DELETE CASCADE NOT NULL,
  is_added_to_feed boolean DEFAULT false,
  scheduled_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, inspiration_id)
);

-- Enable RLS
ALTER TABLE inspiration_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_inspirations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspiration_categories
CREATE POLICY "Anyone can view inspiration categories"
  ON inspiration_categories FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for inspirations
CREATE POLICY "Anyone can view inspirations"
  ON inspirations FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_saved_inspirations
CREATE POLICY "Users can view own saved inspirations"
  ON user_saved_inspirations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved inspirations"
  ON user_saved_inspirations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved inspirations"
  ON user_saved_inspirations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved inspirations"
  ON user_saved_inspirations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_inspirations_profession ON inspirations(profession_type);
CREATE INDEX idx_inspirations_category ON inspirations(category_key);
CREATE INDEX idx_inspirations_season ON inspirations(season);
CREATE INDEX idx_inspirations_mood ON inspirations(mood);
CREATE INDEX idx_user_saved_inspirations_user ON user_saved_inspirations(user_id);

-- Insert common categories (visible for ALL professions)
INSERT INTO inspiration_categories (profession_type, category_key, category_label, subcategory_key, subcategory_label, display_order, is_common) VALUES
('all', 'styles', 'Styles & Ambiances', 'clean', 'Clean', 1, true),
('all', 'styles', 'Styles & Ambiances', 'luxe', 'Luxe', 2, true),
('all', 'styles', 'Styles & Ambiances', 'naturel', 'Naturel', 3, true),
('all', 'styles', 'Styles & Ambiances', 'girly', 'Girly', 4, true),
('all', 'styles', 'Styles & Ambiances', 'audacieux', 'Audacieux', 5, true),

('all', 'angles', 'Angles & Cadrages', 'close_up', 'Gros plan résultat', 1, true),
('all', 'angles', 'Angles & Cadrages', 'before_after', 'Avant / Après', 2, true),
('all', 'angles', 'Angles & Cadrages', 'zoom', 'Zoom texture', 3, true),
('all', 'angles', 'Angles & Cadrages', 'detail', 'Détail finition', 4, true),

('all', 'lights', 'Lumières & Rendus', 'natural', 'Lumière naturelle', 1, true),
('all', 'lights', 'Lumières & Rendus', 'ring', 'Ring light', 2, true),
('all', 'lights', 'Lumières & Rendus', 'soft', 'Lumière douce', 3, true),
('all', 'lights', 'Lumières & Rendus', 'warm_cold', 'Chaud / Froid', 4, true),

('all', 'pro_details', 'Détails qui font pro', 'tools', 'Outils', 1, true),
('all', 'pro_details', 'Détails qui font pro', 'gestures', 'Gestes', 2, true),
('all', 'pro_details', 'Détails qui font pro', 'products', 'Produits', 3, true),
('all', 'pro_details', 'Détails qui font pro', 'finish', 'Brillance / Finition', 4, true);

-- Insert specific categories for nail tech (prothésiste ongulaire)
INSERT INTO inspiration_categories (profession_type, category_key, category_label, subcategory_key, subcategory_label, display_order, is_common) VALUES
('prothesiste_ongulaire', 'moods_saison', 'Moods par saison', 'spring', 'Printemps', 1, false),
('prothesiste_ongulaire', 'moods_saison', 'Moods par saison', 'summer', 'Été', 2, false),
('prothesiste_ongulaire', 'moods_saison', 'Moods par saison', 'autumn', 'Automne', 3, false),
('prothesiste_ongulaire', 'moods_saison', 'Moods par saison', 'winter', 'Hiver', 4, false),

('prothesiste_ongulaire', 'colors', 'Inspirations couleurs', 'nude', 'Nude', 1, false),
('prothesiste_ongulaire', 'colors', 'Inspirations couleurs', 'pastel', 'Pastel', 2, false),
('prothesiste_ongulaire', 'colors', 'Inspirations couleurs', 'bold', 'Bold', 3, false),
('prothesiste_ongulaire', 'colors', 'Inspirations couleurs', 'dark', 'Dark', 4, false),

('prothesiste_ongulaire', 'textures', 'Textures & Effets', 'chrome', 'Chrome', 1, false),
('prothesiste_ongulaire', 'textures', 'Textures & Effets', 'mat', 'Mat', 2, false),
('prothesiste_ongulaire', 'textures', 'Textures & Effets', 'glitter', 'Paillettes', 3, false),
('prothesiste_ongulaire', 'textures', 'Textures & Effets', 'mirror', 'Effet miroir', 4, false),

('prothesiste_ongulaire', 'shapes', 'Formes & Longueurs', 'square', 'Carré', 1, false),
('prothesiste_ongulaire', 'shapes', 'Formes & Longueurs', 'almond', 'Amande', 2, false),
('prothesiste_ongulaire', 'shapes', 'Formes & Longueurs', 'stiletto', 'Stiletto', 3, false),
('prothesiste_ongulaire', 'shapes', 'Formes & Longueurs', 'short', 'Court', 4, false);

-- Insert specific categories for lash artist
INSERT INTO inspiration_categories (profession_type, category_key, category_label, subcategory_key, subcategory_label, display_order, is_common) VALUES
('lash_artist', 'lash_styles', 'Styles de poses', 'natural', 'Naturel', 1, false),
('lash_artist', 'lash_styles', 'Styles de poses', 'volume', 'Volume', 2, false),
('lash_artist', 'lash_styles', 'Styles de poses', 'fox_eyes', 'Fox Eyes', 3, false),
('lash_artist', 'lash_styles', 'Styles de poses', 'doll', 'Doll', 4, false),

('lash_artist', 'mapping', 'Mapping & Angles regard', 'open', 'Regard ouvert', 1, false),
('lash_artist', 'mapping', 'Mapping & Angles regard', 'cat_eye', 'Cat eye', 2, false),
('lash_artist', 'mapping', 'Mapping & Angles regard', 'wide', 'Élargissant', 3, false),

('lash_artist', 'before_after', 'Avant / Après regard', 'transformation', 'Transformation', 1, false),
('lash_artist', 'before_after', 'Avant / Après regard', 'correction', 'Correction', 2, false),

('lash_artist', 'lash_details', 'Détails cils', 'density', 'Densité', 1, false),
('lash_artist', 'lash_details', 'Détails cils', 'finish', 'Finition', 2, false),
('lash_artist', 'lash_details', 'Détails cils', 'curl', 'Courbure', 3, false);

-- Insert specific categories for esthetician
INSERT INTO inspiration_categories (profession_type, category_key, category_label, subcategory_key, subcategory_label, display_order, is_common) VALUES
('estheticienne', 'ambiances', 'Ambiances soin', 'zen', 'Zen', 1, false),
('estheticienne', 'ambiances', 'Ambiances soin', 'luxe_spa', 'Luxe Spa', 2, false),
('estheticienne', 'ambiances', 'Ambiances soin', 'naturel', 'Naturel', 3, false),

('estheticienne', 'gestures', 'Gestes & Textures', 'massage', 'Massage', 1, false),
('estheticienne', 'gestures', 'Gestes & Textures', 'application', 'Application', 2, false),
('estheticienne', 'gestures', 'Gestes & Textures', 'texture', 'Textures produits', 3, false),

('estheticienne', 'products_action', 'Produits en action', 'serum', 'Sérum', 1, false),
('estheticienne', 'products_action', 'Produits en action', 'mask', 'Masque', 2, false),
('estheticienne', 'products_action', 'Produits en action', 'cream', 'Crème', 3, false),

('estheticienne', 'glow', 'Résultat peau & Glow', 'before_after', 'Avant / Après', 1, false),
('estheticienne', 'glow', 'Résultat peau & Glow', 'glow', 'Effet glow', 2, false),
('estheticienne', 'glow', 'Résultat peau & Glow', 'texture', 'Texture peau', 3, false)
ON CONFLICT (profession_type, category_key, subcategory_key) DO NOTHING;