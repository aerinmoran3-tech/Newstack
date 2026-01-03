-- DEPRECATED: Replaced by TypeScript Drizzle migration
-- See migrations/0002_create_property_with_photos.ts

/*
CREATE OR REPLACE FUNCTION create_property_with_photos(p jsonb, image_urls text[])
RETURNS properties AS $$
DECLARE
  new_prop properties%ROWTYPE;
  owner uuid := (p->>'owner_id')::uuid;
  img text;
BEGIN
  INSERT INTO properties (
    title, description, address, city, state, zip_code, price, bedrooms, bathrooms,
    square_feet, property_type, amenities, latitude, longitude, furnished, pets_allowed,
    lease_term, utilities_included, status, listing_status, visibility, expires_at,
    auto_unpublish, expiration_days, price_history, view_count, save_count, application_count,
    listed_at, scheduled_publish_at, address_verified, application_fee, owner_id
  )
  SELECT
    (p->>'title')::text,
    (p->>'description')::text,
    (p->>'address')::text,
    (p->>'city')::text,
    (p->>'state')::text,
    (p->>'zip_code')::text,
    (p->>'price')::numeric,
    (p->>'bedrooms')::integer,
    (p->>'bathrooms')::numeric,
    (p->>'square_feet')::integer,
    (p->>'property_type')::text,
    (p->'amenities')::jsonb,
    (p->>'latitude')::numeric,
    (p->>'longitude')::numeric,
    (p->>'furnished')::boolean,
    (p->>'pets_allowed')::boolean,
    (p->>'lease_term')::text,
    (p->'utilities_included')::jsonb,
    (p->>'status')::text,
    (p->>'listing_status')::text,
    (p->>'visibility')::text,
    (p->>'expires_at')::timestamp,
    (p->>'auto_unpublish')::boolean,
    (p->>'expiration_days')::integer,
    (p->'price_history')::jsonb,
    (p->>'view_count')::integer,
    (p->>'save_count')::integer,
    (p->>'application_count')::integer,
    (p->>'listed_at')::timestamp,
    (p->>'scheduled_publish_at')::timestamp,
    (p->>'address_verified')::boolean,
    (p->>'application_fee')::numeric,
    owner
  RETURNING * INTO new_prop;

  IF image_urls IS NOT NULL THEN
    FOREACH img IN ARRAY image_urls LOOP
      INSERT INTO photos (
        imagekit_file_id, url, thumbnail_url, category, uploader_id, property_id, metadata
      ) VALUES (
        img, img, img, 'property', owner, new_prop.id, jsonb_build_object('source', 'property_creation')
      );
    END LOOP;
  END IF;

  RETURN new_prop;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
