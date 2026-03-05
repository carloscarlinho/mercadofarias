import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: string[] = [];

    // Try to check if tables exist by querying mercados
    const { error: checkError } = await supabase.from('mercados').select('id').limit(1);

    if (checkError && checkError.code === '42P01') {
        // Tables don't exist - user needs to run migration manually
        return NextResponse.json({
            status: 'MIGRATION_NEEDED',
            message: 'As tabelas ainda não existem. Execute o arquivo supabase/migration.sql no SQL Editor do Supabase.',
            url: `https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}/sql/new`,
        });
    }

    // Check if there's a default mercado
    const { data: mercados } = await supabase.from('mercados').select('*');

    if (!mercados || mercados.length === 0) {
        // Insert default mercado
        const { data: newMercado, error: insertError } = await supabase
            .from('mercados')
            .insert({ nome: 'Mercado Farias', telefone: '(11) 99999-9999' })
            .select()
            .single();

        if (insertError) {
            results.push(`Erro ao criar mercado: ${insertError.message}`);
        } else {
            results.push(`Mercado criado: ${newMercado.id}`);
        }
    } else {
        results.push(`Mercado já existe: ${mercados[0].id}`);
    }

    return NextResponse.json({
        status: 'OK',
        mercado_id: mercados?.[0]?.id || 'created',
        results,
    });
}
