-- Enable realtime for slide_decks table (for live slide sync)
ALTER PUBLICATION supabase_realtime ADD TABLE slide_decks;
