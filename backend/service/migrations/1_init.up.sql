CREATE TABLE IF NOT EXISTS keeper.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS keeper.users_info (
    user_id INTEGER PRIMARY KEY
        REFERENCES sso_schema.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
        REFERENCES sso_schema.users(email) ON DELETE CASCADE,
    phone VARCHAR(20) UNIQUE,
    birth_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login TIMESTAMPTZ,
    profile_image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_info_username ON keeper.users_info(username);
CREATE INDEX IF NOT EXISTS idx_users_info_email ON keeper.users_info(email);

CREATE TABLE IF NOT EXISTS keeper.collections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL
        REFERENCES keeper.users_info(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    category_id INTEGER
        REFERENCES keeper.categories(id),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION keeper.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_collections_update
BEFORE UPDATE ON keeper.collections
FOR EACH ROW
EXECUTE FUNCTION keeper.update_updated_at_column();

CREATE TABLE IF NOT EXISTS keeper.items (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL
        REFERENCES keeper.collections(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER
        REFERENCES keeper.categories(id),
    country VARCHAR(100),
    item_images_url TEXT[],
    year SMALLINT CHECK (year >= 0 AND year <= EXTRACT(YEAR FROM now())::SMALLINT),
    attributes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_items_update
BEFORE UPDATE ON keeper.items
FOR EACH ROW
EXECUTE FUNCTION keeper.update_updated_at_column();

CREATE TABLE IF NOT EXISTS keeper.images (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL
        REFERENCES keeper.items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    upload_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS keeper.tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS keeper.item_tags (
    item_id INTEGER NOT NULL
        REFERENCES keeper.items(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL
        REFERENCES keeper.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE IF NOT EXISTS keeper.collection_images (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL
        REFERENCES keeper.collections(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    upload_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE keeper.users_info
    ADD CONSTRAINT chk_phone_format
    CHECK (phone ~ '^\+[1-9]\d{1,14}$');
