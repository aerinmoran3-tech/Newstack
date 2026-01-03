import { insertPropertySchema } from "@shared/schema";
import { cache, CACHE_TTL } from "../../cache";
import { invalidateOwnershipCache } from "../../auth-middleware";
import { getSupabaseOrThrow } from "../../supabase";
import * as propertyRepository from "./property.repository";

/* ------------------------------------------------ */
/* Types */
/* ------------------------------------------------ */

export interface GetPropertiesParams {
  propertyType?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: string;
  ownerId?: string;
  page?: string;
  limit?: string;
}

export interface GetPropertiesResult {
  properties: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CreatePropertyInput {
  body: Record<string, any>;
  userId: string;
}

/* ------------------------------------------------ */
/* Helpers */
/* ------------------------------------------------ */

function validateImageUrls(images: unknown) {
  if (!Array.isArray(images)) return;

  if (images.length > 25) {
    throw new Error("Maximum 25 images per property");
  }

  for (const img of images) {
    if (typeof img !== "string") {
      throw new Error("Images must be strings (ImageKit URLs)");
    }
    if (img.startsWith("data:")) {
      throw new Error("Base64 images are not allowed. Upload to ImageKit first.");
    }
    if (!img.startsWith("http://") && !img.startsWith("https://")) {
      throw new Error("Images must be valid URLs");
    }
  }
}

/* ------------------------------------------------ */
/* Queries */
/* ------------------------------------------------ */

export async function getProperties(
  params: GetPropertiesParams
): Promise<GetPropertiesResult> {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));

  const cacheKey = [
    "properties",
    params.propertyType ?? "",
    params.city ?? "",
    params.minPrice ?? "",
    params.maxPrice ?? "",
    params.status ?? "active",
    params.ownerId ?? "",
    page,
    limit,
  ].join(":");

  const cached = cache.get<GetPropertiesResult>(cacheKey);
  if (cached) return cached;

  const { data = [], count = 0 } =
    await propertyRepository.findAllProperties({
      propertyType: params.propertyType,
      city: params.city,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      status: params.status,
      ownerId: params.ownerId,
      page,
      limit,
    });

  const totalPages = Math.ceil(count / limit);

  const result: GetPropertiesResult = {
    properties: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };

  cache.set(cacheKey, result, CACHE_TTL.PROPERTIES_LIST);
  return result;
}

export async function getPropertyById(id: string): Promise<any> {
  const cacheKey = `property:${id}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const property = await propertyRepository.findPropertyById(id);
  if (!property) return null;

  cache.set(cacheKey, property, CACHE_TTL.PROPERTY_DETAIL);
  return property;
}

/* ------------------------------------------------ */
/* Mutations */
/* ------------------------------------------------ */

export async function createProperty({
  body,
  userId,
}: CreatePropertyInput): Promise<{ data?: any; error?: string }> {
  console.log(`[PROPERTY_SERVICE] Creating property for user ${userId}. Body:`, JSON.stringify(body));
  
  const parsed = insertPropertySchema.safeParse(body);
  if (!parsed.success) {
    console.error("[PROPERTY_SERVICE] Validation failed:", parsed.error.errors);
    return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const propertyData = {
    ...parsed.data,
    owner_id: userId,
  };

  try {
    // Use a DB-side RPC to perform property creation and photo association
    // inside a single transaction (atomic). The migration defines
    // `create_property_with_photos(p jsonb, image_urls text[])`.
    const supabaseClient = getSupabaseOrThrow();
    const images = (parsed.data as any).images as string[] | undefined;

    const rpcParams = {
      p: propertyData,
      image_urls: Array.isArray(images) ? images : [],
    } as any;

    const { data, error } = await supabaseClient.rpc('create_property_with_photos', rpcParams as any);

    if (error) {
      console.error('[PROPERTY_SERVICE] RPC create_property_with_photos failed:', error);
      return { error: error.message || 'Failed to create property' };
    }

    cache.invalidate('properties:');
    return { data } as any;
  } catch (err: any) {
    console.error('[PROPERTY_SERVICE] Repository error:', err);
    return { error: err.message || 'Failed to save property to database' };
  }
}

export async function updateProperty(
  id: string,
  updateData: Record<string, any>,
  userId?: string
): Promise<any> {
  const property = await propertyRepository.findPropertyById(id);

  if (!property) {
    throw new Error("Property not found");
  }

  if (userId && property.owner_id !== userId) {
    console.error(
      `[PROPERTY] Unauthorized update attempt. User=${userId}, Owner=${property.owner_id}`
    );
    throw new Error("Unauthorized: You do not own this property");
  }

  // Images are validated by the Zod schema in insertPropertySchema

  const updated = await propertyRepository.updateProperty(id, updateData);

  // If images were included in the update, associate any uploaded images
  // that exist as orphan photo rows, or insert new photo rows linking
  // to this property. This keeps photos/table in sync when users add
  // images from the edit UI.
  try {
    const images = updateData.images as string[] | undefined;
    if (Array.isArray(images) && images.length > 0) {
      const supabaseClient = getSupabaseOrThrow();
      const toInsert: any[] = [];

      for (const url of images) {
        try {
          const { data: existing } = await supabaseClient
            .from('photos')
            .select('id')
            .eq('url', url)
            .is('property_id', null)
            .limit(1)
            .single();

          if (existing?.id) {
            await supabaseClient.from('photos').update({ property_id: id }).eq('id', existing.id);
          } else {
            toInsert.push({
              imagekit_file_id: url,
              url,
              thumbnail_url: url,
              category: 'property',
              uploader_id: userId || null,
              property_id: id,
              metadata: { source: 'property_update' },
            });
          }
        } catch (e) {
          toInsert.push({
            imagekit_file_id: url,
            url,
            thumbnail_url: url,
            category: 'property',
            uploader_id: userId || null,
            property_id: id,
            metadata: { source: 'property_update' },
          });
        }
      }

      if (toInsert.length > 0) {
        const { error: photoError } = await supabaseClient.from('photos').insert(toInsert);
        if (photoError) {
          console.warn('[PROPERTY_SERVICE] Failed to insert associated photos on update:', photoError);
        }
      }
    }
  } catch (e: any) {
    console.error('[PROPERTY_SERVICE] Error associating photos on update:', e);
  }

  cache.invalidate(`property:${id}`);
  cache.invalidate("properties:");
  invalidateOwnershipCache("property", id);

  return updated;
}

export async function deleteProperty(
  id: string,
  userId?: string
): Promise<null> {
  const property = await propertyRepository.findPropertyById(id);

  if (!property) {
    throw new Error("Property not found");
  }

  if (userId && property.owner_id !== userId) {
    throw new Error("Unauthorized: You do not own this property");
  }

  await propertyRepository.deleteProperty(id);

  cache.invalidate(`property:${id}`);
  cache.invalidate("properties:");
  invalidateOwnershipCache("property", id);

  return null;
}

export async function recordPropertyView(propertyId: string): Promise<void> {
  await propertyRepository.incrementPropertyViews(propertyId);
}