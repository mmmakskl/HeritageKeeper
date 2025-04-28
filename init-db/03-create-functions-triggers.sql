-- Функции
CREATE OR REPLACE FUNCTION keeper.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
CREATE TRIGGER trg_items_update
BEFORE UPDATE ON keeper.items
FOR EACH ROW
EXECUTE FUNCTION keeper.update_updated_at_column();

CREATE TRIGGER trg_collections_update
BEFORE UPDATE ON keeper.collections
FOR EACH ROW
EXECUTE FUNCTION keeper.update_updated_at_column();