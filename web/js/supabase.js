import { createClient } from './vendor/supabase.js';

const SUPABASE_URL = 'https://mkcqjgvradohwlkunepi.supabase.co';
const SUPABASE_CHAVE = 'sb_publishable_-_jVeqsuKsR17jjfNw1kxg_UTsp-cCq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE);
