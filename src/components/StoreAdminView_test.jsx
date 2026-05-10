import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useStoreAdminAuth } from '../hooks/useAuth';
import { useCatalogo } from '../hooks/useCatalogo';
import { linkCliente } from '../utils/storeLinks';
