import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import validate from 'npm:validate-vat';

// Helper to wrap the callback-based validate function in a Promise
function validateVatPromise(countryCode: string, vatNumber: string): Promise<any> {
  return new Promise((resolve, reject) => {
    validate(countryCode, vatNumber, (err: Error | null, validationInfo: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(validationInfo);
      }
    });
  });
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { vatNumber } = await req.json()
    if (!vatNumber || typeof vatNumber !== 'string' || vatNumber.length < 3) {
      return new Response(JSON.stringify({ error: 'vatNumber is required and must be a string (e.g., "IT01234567890")' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const countryCode = vatNumber.substring(0, 2);
    const number = vatNumber.substring(2);

    const result = await validateVatPromise(countryCode, number);

    // The result from `validate-vat` has the keys in PascalCase, let's convert them to camelCase
    // to match the frontend's expectations (traderName, traderAddress).
    const camelCaseResult = {
      uid: result.uid,
      countryCode: result.countryCode,
      vatNumber: result.vatNumber,
      valid: result.valid,
      traderName: result.name,
      traderCompanyType: result.companyType,
      traderAddress: result.address,
      requestDate: result.requestDate
    };

    return new Response(JSON.stringify(camelCaseResult), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in Supabase function:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }
})