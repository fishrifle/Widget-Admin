import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Development utility to verify and test database schema
 * This endpoint checks if the causes table exists and is accessible
 * Can be removed in production if not needed for debugging
 */
export async function POST() {
  try {
    console.log('Checking if causes table exists...');
    
    // First, test if table exists
    const { error: testError } = await supabaseAdmin
      .from('causes')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('Causes table does not exist, creating it...');
      
      // Create causes table using INSERT approach (workaround for RLS)
      try {
        // Create a test widget first to ensure we have a reference
        const { data: widget } = await supabaseAdmin
          .from('widgets')
          .select('id')
          .limit(1)
          .single();
        
        if (!widget) {
          return NextResponse.json({
            error: "No widgets found. Create a widget first.",
          }, { status: 400 });
        }
        
        // Try to manually recreate the causes table by inserting a test record
        // This will fail if table doesn't exist, but we can catch and handle it
        const { error: insertError } = await supabaseAdmin
          .from('causes')
          .insert({
            widget_id: widget.id,
            name: 'Test Cause',
            description: 'Test cause for verification',
            is_active: true
          });
        
        if (insertError) {
          return NextResponse.json({
            error: "Causes table doesn't exist and database admin access needed to create it",
            details: insertError,
            message: "Please run database migrations or contact admin to create causes table"
          }, { status: 500 });
        }
        
        // Clean up test record
        await supabaseAdmin
          .from('causes')
          .delete()
          .eq('name', 'Test Cause');
          
      } catch (createError) {
        return NextResponse.json({
          error: "Failed to create causes table",
          details: createError
        }, { status: 500 });
      }
    } else if (testError) {
      return NextResponse.json({
        error: "Error accessing causes table",
        details: testError
      }, { status: 500 });
    }
    
    console.log('Causes table exists and is accessible');
    
    return NextResponse.json({
      success: true,
      message: "Causes table verified successfully"
    });
    
  } catch (error) {
    console.error('Error checking schema:', error);
    return NextResponse.json({
      error: "Failed to check schema",
      details: error
    }, { status: 500 });
  }
}