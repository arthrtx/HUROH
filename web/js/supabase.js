import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';

// chave pública (publishable): pode estar no frontend, quem protege os dados é o RLS
const SUPABASE_URL = 'https://mkcqjgvradohwlkunepi.supabase.co';
const SUPABASE_CHAVE = 'sb_publishable_-_jVeqsuKsR17jjfNw1kxg_UTsp-cCq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CHAVE);
