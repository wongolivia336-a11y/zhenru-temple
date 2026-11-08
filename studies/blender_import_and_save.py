"""Run in Blender >=4.0: blender -b -P blender_import_and_save.py
Imports the *generated* GLB files and saves an editable component collection .blend.
Does not magically turn research studies into surveyed historical geometry.
"""
import bpy
from pathlib import Path
BASE=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for label,fn in [('DG_BRACKET','zhenru_bracket_research.glb'),('ROOF_TILE','zhenru_roof_tile_eave_research.glb')]:
    previous=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(BASE/'assets'/fn))
    fresh=[obj for obj in bpy.data.objects if obj not in previous]
    collection=bpy.data.collections.new(label)
    bpy.context.scene.collection.children.link(collection)
    for obj in fresh:
        for old_coll in list(obj.users_collection):old_coll.objects.unlink(obj)
        collection.objects.link(obj)
        obj['evidence_grade']='GEOMETRIC_STUDY_NOT_MEASURED'
        obj['research_source']='See docs/EVIDENCE_AND_NEXT_STEPS.md'
    # Both sample components share origin; Blender collection can be isolated.
    collection.hide_render=(label=='ROOF_TILE')
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'assets'/'zhenru_component_study.blend'))
print('Saved editable Blender scene')