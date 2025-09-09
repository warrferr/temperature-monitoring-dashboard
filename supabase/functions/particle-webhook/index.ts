import { createClient } from 'npm:@supabase/supabase-js@2';

interface ParticleWebhookPayload {
  event: string;
  data: string;
  published_at: string;
  coreid: string;
  userid?: string;
  version?: number;
  public?: boolean;
  productID?: number;
  name?: string;
}

interface TemperatureData {
  temp: number;
  temperature?: number; // Keep backward compatibility
  device_name?: string;
  timestamp?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
      return new Response(JSON.stringify({ 
        error: 'Server configuration error - missing environment variables' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the webhook payload from Particle
    const payload: ParticleWebhookPayload = await req.json();
    
    console.log('Received webhook payload:', payload);
    console.log('About to validate required fields...');

    // Validate required fields
    if (!payload || !payload.coreid || !payload.data || !payload.published_at) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: coreid, data, or published_at' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse temperature data
    console.log('About to parse temperature data:', payload.data);
    let temperatureData: TemperatureData;
    try {
      // Try to parse as JSON object first
      const parsed = JSON.parse(payload.data);
      if (typeof parsed === 'object' && parsed !== null) {
        temperatureData = parsed;
      } else {
        // If JSON parsed to a simple number/string, treat as simple number
        throw new Error('Not a JSON object');
      }
    } catch {
      // If not JSON, try to parse as a simple number
      console.log('JSON parse failed, trying as number');
      const temp = parseFloat(payload.data);
      console.log('Parsed temperature value:', temp);
      if (isNaN(temp)) {
        return new Response(
          JSON.stringify({ error: 'Invalid temperature data format' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      temperatureData = { temp: temp };
    }

    // Get temperature value (support both 'temp' and 'temperature' for backward compatibility)
    console.log('Temperature data object:', temperatureData);
    const temperatureValue = temperatureData.temp ?? temperatureData.temperature;
    console.log('Final temperature value:', temperatureValue);

    // Validate temperature value
    if (typeof temperatureValue !== 'number' || isNaN(temperatureValue)) {
      return new Response(
        JSON.stringify({ error: 'Invalid temperature value' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if device exists in our database
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, name')
      .eq('particle_id', payload.coreid)
      .eq('is_active', true)
      .single();

    if (deviceError || !device) {
      console.log(`Device ${payload.coreid} not found or inactive`);
      return new Response(
        JSON.stringify({ error: 'Device not found or inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert temperature reading
    const { error: insertError } = await supabase
      .from('temperature_readings')
      .insert({
        device_id: device.id,
        particle_id: payload.coreid,
        temperature: temperatureValue,
        timestamp: payload.published_at,
      });

    if (insertError) {
      console.error('Error inserting temperature reading:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store temperature reading' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Successfully stored temperature reading: ${temperatureValue}°C from device ${device.name} (${payload.coreid})`);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Temperature reading stored successfully',
        device: device.name,
        temperature: temperatureValue,
        timestamp: payload.published_at,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});