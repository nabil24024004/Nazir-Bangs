// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3"
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { fileName, fileType } = await req.json()

        if (!fileName || !fileType) {
            return new Response(JSON.stringify({ error: 'fileName and fileType are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const s3Client = new S3Client({
            region: "auto",
            endpoint: Deno.env.get("CLOUDFLARE_R2_ENDPOINT"),
            credentials: {
                accessKeyId: Deno.env.get("CLOUDFLARE_R2_ACCESS_KEY_ID") || "",
                secretAccessKey: Deno.env.get("CLOUDFLARE_R2_SECRET_ACCESS_KEY") || "",
            },
        })

        const bucketName = "blog-images"

        const uniqueFileName = crypto.randomUUID() + "-" + fileName

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: uniqueFileName,
            ContentType: fileType,
        })

        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

        return new Response(
            JSON.stringify({
                signedUrl,
                fileName: uniqueFileName,
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
        )
    } catch (err: any) {
        console.error(err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
