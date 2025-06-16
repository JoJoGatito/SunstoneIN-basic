-- Enable RLS bypass for setup
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Clear existing data
DELETE FROM events;
DELETE FROM groups;

-- Insert groups
INSERT INTO groups (id, name, description, icon) VALUES
('sunstone-youth-group', 'Sunstone Youth Group (SYG)', 'A safe and empowering space for LGBTQ+ youth', '🌟'),
('disabitch', 'Disabitch', 'A disability-focused group celebrating neurodiversity', '♿'),
('cafeteria-collective', 'Cafeteria Collective', 'A vibrant community for trans individuals', '🏳️‍⚧️'),
('rock-and-stone', 'Rock and Stone', 'An inclusive outdoor and nature group', '🏔️'),
('Hue-House', 'Hue House', 'A dedicated space for People of Color', '🤝');

-- Insert events from events.json
INSERT INTO events (group_id, title, date, time, location, description, is_featured) VALUES
-- Sunstone Youth Group Events
('sunstone-youth-group', 'Queer Talk', '2025-06-17', '4:00 PM - 8:00 PM', '2111 S Pueblo Blvd, Pueblo, CO 81005', 'Pick an pride or lgbtq related topic, make a google slide presentation about the topic and you can present it to the group. This will be called Queer Talk.', true),
('sunstone-youth-group', 'Movie Night', '2025-06-24', '4:00 PM - 8:00 PM', '2111 S Pueblo Blvd, Pueblo, CO 81005', 'Join us every 4th Tuesday of the month for a cozy night in with popcorn, good vibes, and a community-picked movie! Vote for your favorite film in the Discord channel—whichever gets the most love is what we''ll watch. We''ll provide the movie and the snacks—just bring yourself and get comfy!', false),
('sunstone-youth-group', 'Workshop: Pride Crafts', '2025-07-01', '4:00 PM - 8:00 PM', '2111 S Pueblo Blvd, Pueblo, CO 81005', 'We will be making rainbow pancakes and crafting. Bring your craft supplies and we will bring the pancakes.', false),
('sunstone-youth-group', 'DND & Game Night', '2025-07-08', '4:00 PM - 8:00 PM', '2111 S Pueblo Blvd, Pueblo, CO 81005', 'DnD (if available) or Board/Video Games.', false),
('sunstone-youth-group', 'Queer Talk', '2025-07-15', '4:00 PM - 8:00 PM', '2111 S Pueblo Blvd, Pueblo, CO 81005', 'Pick an pride or lgbtq related topic, make a google slide presentation about the topic and you can present it to the group. This will be called Queer Talk.', false),
('sunstone-youth-group', 'Movie Night', '2025-07-22', '4:00 PM - 8:00 PM', '2111 S Pueblo Blvd, Pueblo, CO 81005', 'Join us every 4th Tuesday of the month for a cozy night in with popcorn, good vibes, and a community-picked movie! Vote for your favorite film in the Discord channel—whichever gets the most love is what we''ll watch. We''ll provide the movie and the snacks—just bring yourself and get comfy!', false),

-- Cafeteria Collective Events
('cafeteria-collective', 'Queer Social', '2025-06-14', '6:00 PM - 11:00 PM', 'The Ethos', 'Join us for a social gathering and some karaoke', true),

-- Rock and Stone Events
('rock-and-stone', 'Pride Hike', '2025-06-29', '1:00 PM - 5:00 PM', '9112 Pueblo Mountain Park Rd, Beulah, CO 81023', 'Come in your hiking gear but rainbow pride! Wear your flags, strut your pride on our hike! Bring water, snack, rainjacket, ect\n\nCarpool Group: Meet at the Rawling library @12:30pm\n\nOther drivers meet us at the Pueblo Mountain Park!', true);

-- Re-enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for read access
CREATE POLICY "Enable read access for all users on groups"
ON groups FOR SELECT
USING (true);

CREATE POLICY "Enable read access for all users on events"
ON events FOR SELECT
USING (true);

-- Verify data
SELECT COUNT(*) as group_count FROM groups;
SELECT COUNT(*) as event_count FROM events;
SELECT g.name, COUNT(e.id) as event_count
FROM groups g
LEFT JOIN events e ON g.id = e.group_id
GROUP BY g.id, g.name
ORDER BY g.name;