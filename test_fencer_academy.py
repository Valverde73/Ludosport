#!/usr/bin/env python3
"""
Unit and integration test suite for Fencer Academy Selector Integration (Modo Rector)
and Supabase Persistence / Synchronization.
"""

import unittest
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class TestFencerAcademyModalUI(unittest.TestCase):
    """Requirement R1: Visibilidad e integración del selector de Academia en Modo Rector."""

    def setUp(self):
        self.html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_selector_exists_in_fencer_modal(self):
        """Selector #fencerAcademyInput must exist inside the #fencerModal dialog."""
        self.assertIn('id="fencerModal"', self.html)
        modal_content = self.html.split('id="fencerModal"')[1].split('</form>')[0]
        self.assertIn('id="fencerAcademyInput"', modal_content)

    def test_selector_fixed_options_almeria_and_granada(self):
        """Selector must provide the exact fixed options 'Almería' and 'Granada'."""
        self.assertIn('<option value="Almería">Almería</option>', self.html)
        self.assertIn('<option value="Granada">Granada</option>', self.html)

    def test_modal_open_initializes_and_loads_fencer_academy(self):
        """openFencerModal must handle defaulting for new fencer and loading existing fencer academy."""
        self.assertIn("openFencerModal(editFencer = null)", self.app_js)
        open_func = self.app_js.split("openFencerModal(editFencer = null)")[1].split("closeFencerModal()")[0]
        
        # New fencer defaults to Almería
        self.assertIn("if (academyInput) academyInput.value = 'Almería';", open_func)
        
        # Edit fencer sets academyInput.value from fencer academy
        self.assertIn("editFencer.academy", open_func)
        self.assertIn("academyInput.value", open_func)


class TestFencerAcademySupabaseSync(unittest.TestCase):
    """Requirement R2: Persistencia y sincronización con Supabase."""

    def setUp(self):
        self.sql = (BASE_DIR / "supabase_schema.sql").read_text(encoding="utf-8")
        self.app_js = (BASE_DIR / "app.js").read_text(encoding="utf-8")

    def test_supabase_schema_table_column(self):
        """fencers table definition must include academy column with DEFAULT 'Almería'."""
        self.assertIn("academy TEXT NOT NULL DEFAULT 'Almería'", self.sql)

    def test_supabase_schema_idempotent_migration(self):
        """Schema script must include safe idempotent ALTER TABLE ADD COLUMN IF NOT EXISTS."""
        self.assertIn("ALTER TABLE public.fencers ADD COLUMN IF NOT EXISTS academy TEXT NOT NULL DEFAULT 'Almería';", self.sql)

    def test_supabase_schema_seed_and_conflict(self):
        """Seed rows must include academy and conflict update must update academy."""
        self.assertIn("INSERT INTO public.fencers (id, name, rank, color, joined_at, photo_url, academy)", self.sql)
        self.assertIn("academy = EXCLUDED.academy", self.sql)

    def test_fencer_to_db_mapper(self):
        """fencerToDb must include academy mapped to Supabase column."""
        to_db_func = self.app_js.split("fencerToDb(f)")[1].split("fencerFromDb(row)")[0]
        self.assertIn("academy:", to_db_func)
        self.assertIn("Almería", to_db_func)

    def test_fencer_from_db_mapper(self):
        """fencerFromDb must map row.academy into the local fencer model."""
        from_db_func = self.app_js.split("fencerFromDb(row)")[1].split("matchToDb(m)")[0]
        self.assertIn("academy:", from_db_func)
        self.assertIn("Almería", from_db_func)

    def test_save_fencer_from_modal_saves_state_and_syncs_to_supabase(self):
        """saveFencerFromModal must read academyInput, store in fencer, and upsert to Supabase."""
        save_func = self.app_js.split("saveFencerFromModal(e)")[1].split("deleteFencer(fencerId)")[0]
        
        # Reads input
        self.assertIn("document.getElementById('fencerAcademyInput')", save_func)
        # Sets on edit
        self.assertIn("f.academy = academy", save_func)
        # Sets on create
        self.assertIn("academy: academy", save_func)
        # Upserts targetFencer to Supabase
        self.assertIn("upsert(this.fencerToDb(targetFencer))", save_func)

    def test_default_fencers_have_almeria_academy(self):
        """All 14 initial default fencers must have academy set to 'Almería'."""
        match = re.search(r'const DEFAULT_FENCERS = \[\s*([\s\S]*?)\n\];', self.app_js)
        self.assertIsNotNone(match, "DEFAULT_FENCERS declaration not found")
        fencers_block = match.group(1)
        # Exactly 14 occurrences of academy: 'Almería'
        almeria_count = fencers_block.count("academy: 'Almería'")
        self.assertEqual(almeria_count, 14, "All 14 default fencers must have academy: 'Almería'")


if __name__ == "__main__":
    unittest.main()
