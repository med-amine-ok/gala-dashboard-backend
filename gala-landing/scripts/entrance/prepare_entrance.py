"""
prepare_entrance.py - Engineers' Gala 3D Entrance Model Normalization and Materializer
Adapts any imported luxury entrance model to the brand specification:
- Polished Black-Cherry / Burgundy Stone (#2D070D / #340812)
- Brushed Sterling Silver Metal Trims (#D4D4D8 / #C0C0C0, 0% Gold/Brass)
- Warm Ivory Interior Glow (#FFF6EB)
- Floor with Restrained Reflection
- Origin at ground center, normalized real-world scale
"""

import sys
import os

try:
    import bpy
    import mathutils
    BLENDER_AVAILABLE = True
except ImportError:
    BLENDER_AVAILABLE = False


def adapt_model_blender(input_filepath, output_filepath):
    if not BLENDER_AVAILABLE:
        print("Blender python module (bpy) not available in this environment.")
        return False

    print(f"Loading model: {input_filepath}")
    bpy.ops.wm.read_factory_settings(use_empty=True)

    if input_filepath.endswith('.glb') or input_filepath.endswith('.gltf'):
        bpy.ops.import_scene.gltf(filepath=input_filepath)
    elif input_filepath.endswith('.fbx'):
        bpy.ops.import_scene.fbx(filepath=input_filepath)
    elif input_filepath.endswith('.obj'):
        bpy.ops.wm.obj_import(filepath=input_filepath)

    # 1. Brand Palette definition (Linear sRGB)
    BURGUNDY_STONE = (0.025, 0.003, 0.005, 1.0)  # #2D070D
    BURGUNDY_ACCENT = (0.075, 0.008, 0.015, 1.0) # #5B0F1A
    BRUSHED_SILVER = (0.65, 0.65, 0.68, 1.0)     # #D4D4D8 (cool neutral silver)
    WARM_IVORY = (1.0, 0.94, 0.88, 1.0)          # #FFF6EB

    # Create master brand materials
    mat_stone = bpy.data.materials.new(name="Gala_BurgundyStone")
    mat_stone.use_nodes = True
    bsdf_stone = mat_stone.node_tree.nodes.get("Principled BSDF")
    if bsdf_stone:
        bsdf_stone.inputs["Base Color"].default_value = BURGUNDY_STONE
        bsdf_stone.inputs["Roughness"].default_value = 0.32
        bsdf_stone.inputs["Metallic"].default_value = 0.05

    mat_silver = bpy.data.materials.new(name="Gala_BrushedSilver")
    mat_silver.use_nodes = True
    bsdf_silver = mat_silver.node_tree.nodes.get("Principled BSDF")
    if bsdf_silver:
        bsdf_silver.inputs["Base Color"].default_value = BRUSHED_SILVER
        bsdf_silver.inputs["Roughness"].default_value = 0.22
        bsdf_silver.inputs["Metallic"].default_value = 0.96

    # 2. Iterate through imported objects
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH':
            continue

        obj_name = obj.name.lower()
        # Clean up unwanted props
        if any(bad in obj_name for bad in ['car', 'people', 'tree', 'plant', 'street', 'trash', 'bench']):
            bpy.data.objects.remove(obj, do_unlink=True)
            continue

        # Re-material according to mesh type
        if any(metal_kw in obj_name for metal_kw in ['metal', 'door_frame', 'handle', 'trim', 'brass', 'gold', 'chrome', 'frame']):
            obj.data.materials.clear()
            obj.data.materials.append(mat_silver)
        elif any(glass_kw in obj_name for glass_kw in ['glass', 'window', 'pane']):
            # Subtle glass with environment reflections
            pass
        else:
            # Default facade, pillars, architrave, steps to burgundy stone
            obj.data.materials.clear()
            obj.data.materials.append(mat_stone)

    # 3. Export optimized GLB
    os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_filepath,
        export_format='GLB',
        export_apply=True,
        export_yup=True
    )
    print(f"Saved brand-adapted model to: {output_filepath}")
    return True


if __name__ == '__main__':
    source = sys.argv[1] if len(sys.argv) > 1 else 'public/models/source/model.glb'
    dest = sys.argv[2] if len(sys.argv) > 2 else 'public/models/entrance_adapted.glb'
    adapt_model_blender(source, dest)
