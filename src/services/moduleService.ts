/**
 * Module service for managing module instances and their data
 * This service handles the full lifecycle: creating instances, managing data, etc.
 */

import { modulesApi, moduleInstancesApi, moduleDataApi } from './apiService';

export interface ModuleInstance {
  id: string;
  module_id: string;
  module_name?: string;
  layout: { x: number; y: number; width: number; height: number };
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get or create a module instance for a given module name and slot
 * This ensures each "slot" has a unique module instance
 */
export async function getOrCreateModuleInstance(
  moduleName: string,
  slotId: string,
  layout?: { x: number; y: number; width: number; height: number }
): Promise<ModuleInstance> {
  try {
    // First, get the module by name
    const module = await modulesApi.getByName(moduleName);
    
    // Try to find existing instance for this slot
    const instances = await moduleInstancesApi.getByModuleName(moduleName);
    const existingInstance = instances.find(
      (inst: any) => {
        try {
          const settings = typeof inst.settings === 'string' 
            ? JSON.parse(inst.settings) 
            : (inst.settings || {});
          return settings?.slotId === slotId;
        } catch (e) {
          return false;
        }
      }
    );

    if (existingInstance) {
      return existingInstance;
    }

    // Create new instance
    const defaultLayout = layout || { x: 0, y: 0, width: 4, height: 4 };
    const newInstance = await moduleInstancesApi.create({
      module_id: module.id,
      layout: defaultLayout,
      settings: { slotId },
    });

    return newInstance;
  } catch (error) {
    console.error('Error getting/creating module instance:', error);
    throw error;
  }
}

/**
 * Get instance ID for a slot (creates instance if needed)
 */
export async function getInstanceIdForSlot(
  moduleName: string,
  slotId: string
): Promise<string> {
  const instance = await getOrCreateModuleInstance(moduleName, slotId);
  return instance.id;
}

/**
 * Delete module instance by slot ID
 */
export async function deleteModuleInstanceBySlot(
  moduleName: string,
  slotId: string
): Promise<void> {
  try {
    const instances = await moduleInstancesApi.getByModuleName(moduleName);
    const instance = instances.find(
      (inst: any) => {
        try {
          const settings = typeof inst.settings === 'string' 
            ? JSON.parse(inst.settings) 
            : (inst.settings || {});
          return settings?.slotId === slotId;
        } catch (e) {
          return false;
        }
      }
    );

    if (instance) {
      await moduleInstancesApi.delete(instance.id);
    }
  } catch (error) {
    console.error('Error deleting module instance:', error);
    throw error;
  }
}

/**
 * Get module data for an instance (or create if doesn't exist)
 */
export async function getOrCreateModuleData(instanceId: string): Promise<any> {
  try {
    const dataRecord = await moduleDataApi.getSingleByInstanceId(instanceId);
    return dataRecord.data || {};
  } catch (error) {
    console.error('Error getting module data:', error);
    // If record doesn't exist, create it
    try {
      const newRecord = await moduleDataApi.create({
        module_instance_id: instanceId,
        data: {},
      });
      return newRecord.data || {};
    } catch (createError) {
      console.error('Error creating module data:', createError);
      return {};
    }
  }
}

/**
 * Update module data for an instance
 */
export async function updateModuleData(instanceId: string, data: any): Promise<void> {
  try {
    // Get the data record ID
    const dataRecord = await moduleDataApi.getSingleByInstanceId(instanceId);
    
    // Update it
    await moduleDataApi.update(dataRecord.id, data);
  } catch (error) {
    console.error('Error updating module data:', error);
    throw error;
  }
}

/**
 * Get all module instances
 */
export async function getAllModuleInstances(): Promise<ModuleInstance[]> {
  try {
    return await moduleInstancesApi.getAll();
  } catch (error) {
    console.error('Error fetching module instances:', error);
    return [];
  }
}

/**
 * Update module instance layout
 */
export async function updateModuleInstanceLayout(
  instanceId: string,
  layout: { x: number; y: number; width: number; height: number }
): Promise<void> {
  try {
    await moduleInstancesApi.update(instanceId, { layout });
  } catch (error) {
    console.error('Error updating module instance layout:', error);
    throw error;
  }
}

/**
 * Update module instance settings
 */
export async function updateModuleInstanceSettings(
  instanceId: string,
  settings: Record<string, any>
): Promise<void> {
  try {
    await moduleInstancesApi.update(instanceId, { settings });
  } catch (error) {
    console.error('Error updating module instance settings:', error);
    throw error;
  }
}

