
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Tesseract } from 'https://esm.sh/tesseract.js@5.0.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Extended Aadhaar card extraction patterns
const extractionPatterns = {
  aadhaar: {
    number: /[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}/g,
    name: /(Name|नाम)[:\s]+([^\n]+)/i,
    dob: /(DOB|Date\s+of\s+Birth|जन्म\s+तिथि)[:\s]+([0-9]{1,2}[-/.][0-9]{1,2}[-/.][0-9]{2,4})/i,
    gender: /(Male|Female|महिला|पुरुष|MALE|FEMALE)/i,
    address: /(Address|पता)[:\s]+([^\n]+(\n[^\n]+)*)/i
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ error: 'Server misconfigured - missing environment variables' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { documentId } = await req.json()
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Starting OCR processing for document: ${documentId}`)

    // Get the document
    const { data: documentData, error: docError } = await supabase
      .from('kyc_document_extractions')
      .select('*')
      .eq('id', documentId)
      .single()
      
    if (docError || !documentData) {
      console.error('Error fetching document:', docError)
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Skip OCR for selfie
    if (documentData.document_type === 'selfie') {
      return new Response(
        JSON.stringify({ message: 'Skipped OCR for selfie', data: {} }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL for the document
    const documentUrl = documentData.document_url
    
    // Initialize Tesseract with Hindi language support for better Aadhaar recognition
    const worker = await Tesseract.createWorker({
      langPath: 'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_best',
      langs: ['eng', 'hin'],
      logger: m => console.log(m)
    });
    
    // Load both English and Hindi for better Aadhaar card recognition
    await worker.loadLanguage('eng+hin');
    await worker.initialize('eng+hin');
    
    // Set recognition parameters for improved accuracy
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-: ',
      preserve_interword_spaces: '1',
    });
    
    // Process the image
    console.log(`Processing image: ${documentUrl}`)
    const result = await worker.recognize(documentUrl)
    await worker.terminate()
    
    console.log('OCR completed')
    
    // Extract data from OCR results with enhanced regex patterns for Aadhaar cards
    const text = result.data.text
    console.log('Extracted text:', text)
    
    // Initialize extracted data
    let extractedData: Record<string, string> = {}
    
    // Extract Aadhaar number (12 digits, may have spaces)
    const aadhaarMatch = text.match(extractionPatterns.aadhaar.number)
    if (aadhaarMatch) {
      extractedData.aadhaar_number = aadhaarMatch[0].replace(/\s/g, '')
    }
    
    // Try to extract name with improved regex
    const nameMatch = text.match(extractionPatterns.aadhaar.name)
    if (nameMatch && nameMatch[2]) {
      extractedData.name = nameMatch[2].trim()
    }
    
    // Try to extract DOB with improved regex
    const dobMatch = text.match(extractionPatterns.aadhaar.dob)
    if (dobMatch && dobMatch[2]) {
      extractedData.dob = dobMatch[2].trim()
    }
    
    // Try to extract gender with improved regex
    const genderMatch = text.match(extractionPatterns.aadhaar.gender)
    if (genderMatch && genderMatch[1]) {
      const gender = genderMatch[1].toUpperCase()
      extractedData.gender = gender === 'MALE' || gender === 'पुरुष' ? 'MALE' : 'FEMALE'
    }
    
    // Try to extract address with improved regex
    const addressMatch = text.match(extractionPatterns.aadhaar.address)
    if (addressMatch && addressMatch[2]) {
      extractedData.address = addressMatch[2].trim().replace(/\n/g, ', ')
    }
    
    console.log('Extracted data:', extractedData)
    
    // Update the document with extracted data
    const { error: updateError } = await supabase
      .from('kyc_document_extractions')
      .update({ 
        extracted_data: extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      
    if (updateError) {
      console.error('Error updating document with OCR data:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update document with OCR data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Update the verification record with extracted data and set status to pending
    if (documentData.verification_id) {
      // Get the current verification record
      const { data: verificationData, error: verificationError } = await supabase
        .from('kyc_verifications')
        .select('extracted_data')
        .eq('id', documentData.verification_id)
        .single()
        
      if (!verificationError && verificationData) {
        // Merge existing data with new data
        const mergedData = { 
          ...verificationData.extracted_data,
          ...extractedData 
        }
        
        // Update the verification record
        await supabase
          .from('kyc_verifications')
          .update({ 
            extracted_data: mergedData,
            ocr_status: 'completed',
            status: 'Pending'  // Always set to Pending, not Rejected
          })
          .eq('id', documentData.verification_id)
      }
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'OCR processing completed', 
        data: extractedData 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in OCR processing:', error)
    return new Response(
      JSON.stringify({ error: 'Processing failed: ' + error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
