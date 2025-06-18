-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Resources Table
CREATE TABLE public.resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    contact JSONB NOT NULL,
    hours JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Resource Categories Table
CREATE TABLE public.resource_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Resource Tags Table
CREATE TABLE public.resource_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT true
);

-- Resource-Tags Junction Table
CREATE TABLE public.resource_tag_mappings (
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.resource_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (resource_id, tag_id)
);

-- Add foreign key constraint for category
ALTER TABLE public.resources
ADD CONSTRAINT fk_resource_category
FOREIGN KEY (category_id)
REFERENCES public.resource_categories(id)
ON DELETE RESTRICT;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to resources table
CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tag_mappings ENABLE ROW LEVEL SECURITY;

-- Resources RLS Policies
CREATE POLICY "Resources are viewable by everyone"
    ON public.resources
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Allow resource creation for authenticated users"
    ON public.resources
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow resource updates for creators"
    ON public.resources
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Allow soft delete for creators"
    ON public.resources
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (
        auth.uid() = created_by 
        AND NEW.is_active = false
        AND OLD.is_active = true
    );

-- Categories RLS Policies
CREATE POLICY "Categories are viewable by everyone"
    ON public.resource_categories
    FOR SELECT
    USING (true);

CREATE POLICY "Admin only category management"
    ON public.resource_categories
    FOR ALL
    TO authenticated
    USING (auth.role() = 'admin'::text)
    WITH CHECK (auth.role() = 'admin'::text);

-- Tags RLS Policies
CREATE POLICY "Tags are viewable by everyone"
    ON public.resource_tags
    FOR SELECT
    USING (true);

CREATE POLICY "Admin only tag management"
    ON public.resource_tags
    FOR ALL
    TO authenticated
    USING (auth.role() = 'admin'::text)
    WITH CHECK (auth.role() = 'admin'::text);

-- Tag Mappings RLS Policies
CREATE POLICY "Tag mappings are viewable by everyone"
    ON public.resource_tag_mappings
    FOR SELECT
    USING (true);

CREATE POLICY "Tag mapping modifications follow resource access"
    ON public.resource_tag_mappings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.resources
            WHERE id = resource_tag_mappings.resource_id
            AND created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.resources
            WHERE id = resource_tag_mappings.resource_id
            AND created_by = auth.uid()
        )
    );

-- Insert default categories
INSERT INTO public.resource_categories (name, icon, description) VALUES
    ('Healthcare', '🏥', 'Healthcare providers and mental health resources'),
    ('Community Spaces', '🏢', 'Safe and inclusive gathering spaces'),
    ('Organizations', '🏛️', 'Community organizations and nonprofits');

-- Insert default tags
INSERT INTO public.resource_tags (name, description) VALUES
    ('Queer Affirming', 'Services and spaces that are explicitly welcoming and supportive of LGBTQIA+ individuals'),
    ('Accessibility', 'Includes features like wheelchair access, ASL interpretation, or sensory-friendly spaces'),
    ('Sliding Scale', 'Fees are adjusted based on income or ability to pay');

-- Add indexes for better query performance
CREATE INDEX idx_resources_category ON public.resources(category_id);
CREATE INDEX idx_resources_created_by ON public.resources(created_by);
CREATE INDEX idx_resources_is_active ON public.resources(is_active);
CREATE INDEX idx_tag_mappings_resource ON public.resource_tag_mappings(resource_id);
CREATE INDEX idx_tag_mappings_tag ON public.resource_tag_mappings(tag_id);