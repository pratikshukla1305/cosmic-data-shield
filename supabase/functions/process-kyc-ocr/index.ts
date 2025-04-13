
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { Tesseract } from 'https://esm.sh/tesseract.js@5.0.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Start OCR processing
    console.log(`Starting OCR processing for document: ${documentId}`)
    
    // Get public URL for the document
    const documentUrl = documentData.document_url
    
    // Initialize Tesseract
    const worker = await Tesseract.createWorker('eng')
    
    // Process the image
    console.log(`Processing image: ${documentUrl}`)
    const result = await worker.recognize(documentUrl)
    await worker.terminate()
    
    console.log('OCR completed')
    
    // Extract data from OCR results with regex patterns for Aadhaar cards
    const text = result.data.text
    console.log('Extracted text:', text)
    
    // Initialize extracted data
    let extractedData = {}
    
    // Extract Aadhaar number (12 digits, may have spaces)
    const aadhaarPattern = /[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}/g
    const aadhaarMatch = text.match(aadhaarPattern)
    
    if (aadhaarMatch) {
      extractedData = { 
        ...extractedData, 
        aadhaar_number: aadhaarMatch[0].replace(/\s/g, ''),
      }
    }
    
    // Try to extract name (Assuming pattern "Name: XXX" or just guessing based on position)
    const namePattern = /Name[:\s]+([^\n]+)/i
    const nameMatch = text.match(namePattern)
    
    if (nameMatch && nameMatch[1]) {
      extractedData = { 
        ...extractedData, 
        name: nameMatch[1].trim(),
      }
    }
    
    // Try to extract DOB (formats like DD/MM/YYYY or YYYY-MM-DD)
    const dobPattern = /(?:DOB|Date\s+of\s+Birth)[:\s]+([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i
    const dobMatch = text.match(dobPattern)
    
    if (dobMatch && dobMatch[1]) {
      extractedData = { 
        ...extractedData, 
        dob: dobMatch[1].trim(),
      }
    }
    
    // Try to extract gender
    const genderPattern = /(?:(?:gender|sex)[:\s]+)?(male|female|transgender)/i
    const genderMatch = text.match(genderPattern)
    
    if (genderMatch && genderMatch[1]) {
      extractedData = { 
        ...extractedData, 
        gender: genderMatch[1].toUpperCase(),
      }
    }
    
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
    
    // Update the verification record with extracted data
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
            ocr_status: 'completed'
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
