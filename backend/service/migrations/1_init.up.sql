CREATE TABLE IF NOT EXISTS keeper.users_info
(
    user_id SERIAL PRIMARY KEY REFERENCES sso_schema.users(id),
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL REFERENCES sso_schema.users(email),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    profile_image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_blocked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS keeper.collections
(
    collection_id SERIAL PRIMARY KEY NOT NULL,
    user_id SERIAL NOT NULL REFERENCES keeper.users_info(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS keeper.items
(
    item_id SERIAL PRIMARY KEY NOT NULL,
    collection_id SERIAL NOT NULL REFERENCES keeper.collections(collection_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    attributes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keeper.images
(
    image_id SERIAL PRIMARY KEY NOT NULL,
    item_id SERIAL NOT NULL REFERENCES keeper.items(item_id) ON DELETE CASCADE,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keeper.tags
(
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS keeper.item_tags
(
    item_id SERIAL NOT NULL REFERENCES keeper.items(item_id) ON DELETE CASCADE,
    tag_id SERIAL NOT NULL REFERENCES keeper.tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, tag_id)
);

