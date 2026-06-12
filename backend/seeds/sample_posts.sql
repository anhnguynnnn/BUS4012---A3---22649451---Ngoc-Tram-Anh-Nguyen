-- ============================================================
-- MUSE Sample Posts Seed — 22 posts with full recommendation metadata
-- Run in Supabase SQL Editor or via psql.
-- Uses ON CONFLICT so it is safe to re-run.
-- ============================================================

-- Remove old seed data first (optional — comment out if you want append-only)
-- TRUNCATE public.posts CASCADE;

INSERT INTO public.posts (
  id,
  creator_name,
  image_url,
  description,
  style_tags,
  fit_tags,
  gender_style,
  occasion_tags,
  size_range,
  height_range,
  body_friendly_label,
  match_label_primary,
  match_label_secondary,
  view_count,
  save_count,
  share_count
) VALUES

-- ============================================================
-- 1  Minimal / Clean · Womenswear · Office
--    Covers: minimal, clean | relaxed fit, structured | womenswear | office, formal
--    Sizes: S–M, M–L | Height: 165–175 cm
-- ============================================================
(
  
  'Angie Wong',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85',
  'Elevated office-ready look with clean lines and neutral tones.',
  ARRAY['minimal','clean'],
  ARRAY['relaxed fit','structured'],
  ARRAY['womenswear'],
  ARRAY['office','formal'],
  ARRAY['S–M','M–L'],
  '165–175 cm',
  'Relaxed fit with gentle structure',
  'Matches your minimal preference',
  'Clean structured office layers',
  62, 24, 5
),

-- ============================================================
-- 2  Feminine / Soft · Womenswear · Everyday
--    Covers: feminine, soft | more coverage, relaxed fit | womenswear | everyday, casual
--    Sizes: L–XL, XL+ | Height: 155–165 cm
-- ============================================================
(
  
  'Maya Ellis',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85',
  'Soft layers for everyday movement and comfort.',
  ARRAY['feminine','soft'],
  ARRAY['more coverage','relaxed fit'],
  ARRAY['womenswear'],
  ARRAY['everyday','casual'],
  ARRAY['L–XL','XL+'],
  '155–165 cm',
  'Soft shape with comfortable coverage',
  'Body reference match',
  'Soft layers for everyday comfort',
  48, 18, 3
),

-- ============================================================
-- 3  Streetwear · Menswear + Gender-neutral · Weekend
--    Covers: streetwear | loose fit, relaxed fit | menswear, gender-neutral | weekend, casual
--    Sizes: S–M, M–L | Height: 175+ cm
-- ============================================================
(
  
  'Noah Reyes',
  'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=85',
  'Weekend streetwear with relaxed volume and bold layers.',
  ARRAY['streetwear','trend-driven','casual'],
  ARRAY['loose fit','relaxed fit'],
  ARRAY['menswear','gender-neutral'],
  ARRAY['weekend','casual'],
  ARRAY['S–M','M–L'],
  '175+ cm',
  'Loose fit for easy layering',
  'Streetwear-inspired oversized fit',
  'Similar proportions',
  95, 38, 9
),

-- ============================================================
-- 4  Classic / Tailored · Womenswear · Petite · Formal
--    Covers: classic, tailored | structured, balance proportions | womenswear | dinner, formal
--    Sizes: XXS–XS, S–M | Height: Under 155 cm
-- ============================================================
(
  
  'Priya Shah',
  'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=85',
  'Classic tailoring for dinner plans with balanced proportions.',
  ARRAY['classic','tailored','formal'],
  ARRAY['structured','balance proportions'],
  ARRAY['womenswear'],
  ARRAY['dinner','formal'],
  ARRAY['XXS–XS','S–M'],
  'Under 155 cm',
  'Compact tailoring with balanced lines',
  'Classic tailored structure',
  'Petite-friendly balanced tailoring',
  55, 19, 4
),

-- ============================================================
-- 5  Minimal / Clean · Gender-neutral · Campus
--    Covers: minimal, clean | relaxed fit, more coverage | gender-neutral | campus, everyday
--    Sizes: M–L, L–XL | Height: 165–175 cm
-- ============================================================
(
 
  'Sam Taylor',
  'https://images.unsplash.com/photo-1506629905607-d9c297d2f5f8?auto=format&fit=crop&w=900&q=85',
  'Clean campus layers with relaxed everyday ease.',
  ARRAY['minimal','clean','casual'],
  ARRAY['relaxed fit','more coverage'],
  ARRAY['gender-neutral'],
  ARRAY['campus','everyday'],
  ARRAY['M–L','L–XL'],
  '165–175 cm',
  'Everyday layers with gentle coverage',
  'Minimal everyday layering',
  'Gender-neutral campus fit',
  44, 14, 2
),

-- ============================================================
-- 6  Feminine / Soft · Womenswear · Event
--    Covers: feminine, soft | highlight waist, structured | womenswear | event, formal
--    Sizes: S–M, M–L | Height: 155–165 cm
-- ============================================================
(

  'Leila Moore',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=85',
  'Event look with soft waist detail and comfortable structure.',
  ARRAY['feminine','soft','formal'],
  ARRAY['highlight waist','structured'],
  ARRAY['womenswear'],
  ARRAY['event','formal'],
  ARRAY['S–M','M–L'],
  '155–165 cm',
  'Soft detail with comfortable structure',
  'Feminine silhouette that defines the waist',
  'Waist-defining formal elegance',
  67, 28, 5
),

-- ============================================================
-- 7  Classic / Tailored · Menswear + Gender-neutral · Tall
--    Covers: classic, tailored | structured, balance proportions | menswear, gender-neutral | office, formal
--    Sizes: L–XL, XL+ | Height: 175+ cm
-- ============================================================
(
  
  'Jordan Kim',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85',
  'Tailored neutrals for work with structured shoulders.',
  ARRAY['classic','tailored','office'],
  ARRAY['structured','balance proportions'],
  ARRAY['menswear','gender-neutral'],
  ARRAY['office','formal'],
  ARRAY['L–XL','XL+'],
  '175+ cm',
  'Structured pieces with balanced proportions',
  'Classic tailored structure',
  'Tall structured office fit',
  73, 32, 7
),

-- ============================================================
-- 8  Minimal / Clean · Womenswear · Weekend
--    Covers: minimal, clean | loose fit, relaxed fit | womenswear | weekend, everyday
--    Sizes: XXS–XS, S–M | Height: 165–175 cm
-- ============================================================
(

  'Elena Park',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85',
  'Minimal weekend monochrome with relaxed ease.',
  ARRAY['minimal','clean','casual'],
  ARRAY['loose fit','relaxed fit'],
  ARRAY['womenswear'],
  ARRAY['weekend','everyday'],
  ARRAY['XXS–XS','S–M'],
  '165–175 cm',
  'Monochrome layers with relaxed ease',
  'Minimal weekend monochrome',
  'Loose relaxed weekend fit',
  52, 16, 3
),

-- ============================================================
-- 9  Streetwear · Menswear · Layering
--    Covers: streetwear | more coverage, loose fit | menswear | everyday, weekend
--    Sizes: M–L, L–XL | Height: 175+ cm
-- ============================================================
(

  'Amir Hassan',
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=900&q=85',
  'Street-ready layers for cooler days with coverage focus.',
  ARRAY['streetwear','casual','trend-driven'],
  ARRAY['more coverage','loose fit'],
  ARRAY['menswear'],
  ARRAY['everyday','weekend'],
  ARRAY['M–L','L–XL'],
  '175+ cm',
  'Coverage-focused layering',
  'Layering match',
  'Street-ready loose coverage',
  88, 35, 8
),

-- ============================================================
-- 10 Classic + Feminine · Womenswear · Office
--    Covers: classic, feminine | highlight waist, balance proportions | womenswear | office, event
--    Sizes: S–M, M–L | Height: 155–165 cm
-- ============================================================
(

  'Chloe Nguyen',
  'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=900&q=85',
  'Soft classic look for presentations and meetings.',
  ARRAY['classic','feminine','office'],
  ARRAY['highlight waist','balance proportions'],
  ARRAY['womenswear'],
  ARRAY['office','event'],
  ARRAY['S–M','M–L'],
  '155–165 cm',
  'Soft classic styling with proportion balance',
  'Soft classic for presentations',
  'Waist-defining office elegance',
  58, 22, 4
),

-- ============================================================
-- 11 Trend-driven + Minimal · Gender-neutral · Office
--    Covers: minimal, tailored, clean | structured, relaxed fit | gender-neutral | formal, office
--    Sizes: XL+, L–XL | Height: 165–175 cm
-- ============================================================
(

  'Riley Stone',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
  'Gender-neutral clean tailoring with room to move.',
  ARRAY['minimal','tailored','clean'],
  ARRAY['structured','relaxed fit'],
  ARRAY['gender-neutral'],
  ARRAY['formal','office'],
  ARRAY['XL+','L–XL'],
  '165–175 cm',
  'Clean tailoring with room to move',
  'Clean fit match',
  'Gender-neutral tailored ease',
  63, 22, 4
),

-- ============================================================
-- 12 Trend-driven + Feminine · Womenswear · Petite · Event
--    Covers: trend-driven, feminine | balance proportions, more coverage | womenswear | dinner, event
--    Sizes: M–L, L–XL | Height: Under 155 cm
-- ============================================================
(

  'Tara Brooks',
  'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
  'Trend-led dinner texture mix with balanced styling.',
  ARRAY['trend-driven','feminine','formal'],
  ARRAY['balance proportions','more coverage'],
  ARRAY['womenswear'],
  ARRAY['dinner','event'],
  ARRAY['M–L','L–XL'],
  'Under 155 cm',
  'Texture mix with balanced styling',
  'Trend-forward dinner style',
  'Petite-friendly texture balance',
  78, 31, 6
),

-- ============================================================
-- 13 Streetwear · Menswear · Casual
--    Covers: streetwear, clean | loose fit, relaxed fit | menswear | everyday, campus
--    Sizes: M–L, L–XL | Height: 165–175 cm
-- ============================================================
(

  'Theo Martin',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=85',
  'Oversized denim with clean sneakers for campus days.',
  ARRAY['streetwear','casual','clean'],
  ARRAY['loose fit','relaxed fit'],
  ARRAY['menswear'],
  ARRAY['everyday','campus'],
  ARRAY['M–L','L–XL'],
  '165–175 cm',
  'Roomy denim layers',
  'Relaxed fit match',
  'Streetwear denim for everyday',
  56, 20, 4
),

-- ============================================================
-- 14 Minimal + Classic · Menswear · Weekend
--    Covers: minimal, classic | relaxed fit, loose fit | menswear | weekend, casual
--    Sizes: L–XL, XL+ | Height: 175+ cm
-- ============================================================
(

  'Ben Carter',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',
  'Relaxed linen shirt for warm weekend days.',
  ARRAY['minimal','classic','casual'],
  ARRAY['relaxed fit','loose fit'],
  ARRAY['menswear'],
  ARRAY['weekend','casual'],
  ARRAY['L–XL','XL+'],
  '175+ cm',
  'Easy breathable fit',
  'Easy fit match',
  'Classic relaxed weekend style',
  41, 13, 2
),

-- ============================================================
-- 15 Classic / Tailored · Womenswear · Office
--    Covers: classic, tailored | structured, balance proportions | womenswear | office, formal
--    Sizes: L–XL, XL+ | Height: 165–175 cm
-- ============================================================
(

  'Nina Patel',
  'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=900&q=85',
  'Blazer and wide-leg trousers for important meetings.',
  ARRAY['classic','tailored','office'],
  ARRAY['structured','balance proportions'],
  ARRAY['womenswear'],
  ARRAY['office','formal'],
  ARRAY['L–XL','XL+'],
  '165–175 cm',
  'Balanced tailored lines',
  'Power tailoring for office',
  'Structured balanced proportions',
  72, 31, 6
),

-- ============================================================
-- 16 Feminine / Soft + Minimal · Womenswear · Petite
--    Covers: feminine, minimal, soft | highlight waist, balance proportions | womenswear | dinner, event
--    Sizes: XXS–XS, S–M | Height: 155–165 cm
-- ============================================================
(

  'Ava Robinson',
  'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85',
  'Satin skirt with simple knit top for dinner dates.',
  ARRAY['feminine','minimal','soft'],
  ARRAY['highlight waist','balance proportions'],
  ARRAY['womenswear'],
  ARRAY['dinner','event'],
  ARRAY['XXS–XS','S–M'],
  '155–165 cm',
  'Soft proportion balance',
  'Feminine minimal elegance',
  'Waist-defining satin silhouette',
  53, 18, 3
),

-- ============================================================
-- 17 Streetwear + Trend · Gender-neutral · Weekend
--    Covers: streetwear, trend-driven | relaxed fit, more coverage | gender-neutral | weekend, everyday
--    Sizes: S–M, M–L | Height: 165–175 cm
-- ============================================================
(

  'Kai Morgan',
  'https://images.unsplash.com/photo-1480455624313-e29b44bbafbde?auto=format&fit=crop&w=900&q=85',
  'Utility jacket with relaxed cargos for practical weekends.',
  ARRAY['streetwear','trend-driven','casual'],
  ARRAY['relaxed fit','more coverage'],
  ARRAY['gender-neutral'],
  ARRAY['weekend','everyday'],
  ARRAY['S–M','M–L'],
  '165–175 cm',
  'Practical relaxed styling',
  'Utility streetwear for all',
  'Gender-neutral relaxed fit',
  61, 24, 5
),

-- ============================================================
-- 18 Feminine / Soft + Classic · Womenswear · Everyday
--    Covers: feminine, classic | more coverage, relaxed fit | womenswear | everyday, dinner
--    Sizes: L–XL, XL+ | Height: 155–165 cm
-- ============================================================
(

  'Sofia Lee',
  'https://images.unsplash.com/photo-1502716119720-b23a1e3b5b52?auto=format&fit=crop&w=900&q=85',
  'Layered maxi skirt and cotton shirt with flow.',
  ARRAY['feminine','classic','soft'],
  ARRAY['more coverage','relaxed fit'],
  ARRAY['womenswear'],
  ARRAY['everyday','dinner'],
  ARRAY['L–XL','XL+'],
  '155–165 cm',
  'Covered layers with flow',
  'Soft feminine layering',
  'Relaxed coverage with classic flow',
  44, 15, 2
),

-- ============================================================
-- 19 Streetwear + Trend · Menswear + Gender-neutral
--    Covers: streetwear, trend-driven | loose fit, more coverage | menswear, gender-neutral | weekend, everyday
--    Sizes: M–L, L–XL | Height: 175+ cm
-- ============================================================
(

  'Ezra Blake',
  'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=900&q=85',
  'Graphic hoodie with longline coat for layered streetwear.',
  ARRAY['streetwear','trend-driven','casual'],
  ARRAY['loose fit','more coverage'],
  ARRAY['menswear','gender-neutral'],
  ARRAY['weekend','everyday'],
  ARRAY['M–L','L–XL'],
  '175+ cm',
  'Layered streetwear coverage',
  'Streetwear match',
  'Trend-forward oversized layers',
  103, 45, 12
),

-- ============================================================
-- 20 Minimal + Tailored · Menswear + Gender-neutral · Office
--    Covers: minimal, tailored | structured, relaxed fit | menswear, gender-neutral | office, everyday
--    Sizes: S–M, M–L | Height: 175+ cm
-- ============================================================
(

  'Lucas Green',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85',
  'Black tee and tailored coat with clean structure.',
  ARRAY['minimal','tailored','clean'],
  ARRAY['structured','relaxed fit'],
  ARRAY['menswear','gender-neutral'],
  ARRAY['office','everyday'],
  ARRAY['S–M','M–L'],
  '175+ cm',
  'Clean structure with ease',
  'Minimal fit match',
  'Tailored minimal for tall frames',
  79, 33, 7
),

-- ============================================================
-- 21 Minimal + Classic + Feminine · Womenswear · Casual
--    Covers: minimal, classic, feminine | highlight waist, relaxed fit | womenswear | casual, event
--    Sizes: S–M, M–L | Height: 165–175 cm
-- ============================================================
(

  'Mila Santos',
  'https://images.unsplash.com/photo-1581044777550-4cfa60707998?auto=format&fit=crop&w=900&q=85',
  'Monochrome dress with flat sandals and simple movement.',
  ARRAY['minimal','classic','feminine'],
  ARRAY['highlight waist','relaxed fit'],
  ARRAY['womenswear'],
  ARRAY['casual','event'],
  ARRAY['S–M','M–L'],
  '165–175 cm',
  'Simple shape with movement',
  'Everyday feminine minimalism',
  'Relaxed feminine with waist definition',
  47, 14, 3
),

-- ============================================================
-- 22 Trend-driven + Feminine · Womenswear · Petite
--    Covers: trend-driven, feminine | balance proportions, highlight waist | womenswear | casual, brunch
--    Sizes: XXS–XS, S–M | Height: Under 155 cm
-- ============================================================
(

  'Stella Trend',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',
  'Feminine trends spotted on the street for brunch dates.',
  ARRAY['trend-driven','feminine'],
  ARRAY['balance proportions','highlight waist'],
  ARRAY['womenswear'],
  ARRAY['casual','brunch'],
  ARRAY['XXS–XS','S–M'],
  'Under 155 cm',
  'Trend-driven feminine fit',
  'Street-spotted feminine trends',
  'Feminine trend highlights',
  88, 37, 8
)

ON CONFLICT (id) DO UPDATE SET
  creator_name = EXCLUDED.creator_name,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  style_tags = EXCLUDED.style_tags,
  fit_tags = EXCLUDED.fit_tags,
  gender_style = EXCLUDED.gender_style,
  occasion_tags = EXCLUDED.occasion_tags,
  size_range = EXCLUDED.size_range,
  height_range = EXCLUDED.height_range,
  body_friendly_label = EXCLUDED.body_friendly_label,
  match_label_primary = EXCLUDED.match_label_primary,
  match_label_secondary = EXCLUDED.match_label_secondary,
  view_count = EXCLUDED.view_count,
  save_count = EXCLUDED.save_count,
  share_count = EXCLUDED.share_count;