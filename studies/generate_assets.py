#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Zhenru Temple / component study (not a measured restoration).
Generate standalone GLB studies for a timber bracket set and roof-eave tiles.
Requirements: pip install numpy trimesh shapely
Run: python generate_assets.py
All coordinates use meters, X horizontal / Y up / Z depth.
"""
from __future__ import annotations
import json, math
from pathlib import Path
import numpy as np
import trimesh

BASE = Path(__file__).resolve().parent
ASSETS = BASE / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

# Color data only: never interpret as sampled material values from Zhenru Temple.
COLORS = {
    "aged_wood": [87, 54, 35, 255],
    "red_wood": [118, 69, 47, 255],
    "end_grain": [137, 93, 62, 255],
    "wood_shadow": [52, 35, 26, 255],
    "dark_tile": [59, 62, 61, 255],
    "tile_high": [80, 81, 77, 255],
    "tile_cool": [68, 73, 72, 255],
    "mortar": [97, 97, 91, 255],
}

class Asset:
    def __init__(self):
        self.scene = trimesh.Scene()
        self.records = []
        self.count = 0
    def add(self, mesh, name, material, group="", grade="visual_study"):
        assert isinstance(mesh, trimesh.Trimesh), (name, type(mesh))
        mesh = mesh.copy()
        mesh.visual.vertex_colors = np.tile(COLORS[material], (len(mesh.vertices), 1))
        self.count += 1
        node = f"{self.count:03d}_{name}"
        self.scene.add_geometry(mesh, geom_name=node, node_name=node)
        self.records.append(dict(node=node,group=group or name, material=material,
                                 grade=grade, triangles=len(mesh.faces), watertight=bool(mesh.is_watertight)))
    def export(self, name):
        path = ASSETS / name
        path.write_bytes(self.scene.export(file_type="glb"))
        return path

def box(w,h,d,center=(0,0,0)):
    m=trimesh.creation.box(extents=[w,h,d]);m.apply_translation(center);return m

def y_cylinder(radius,height,center=(0,0,0), sections=24):
    m=trimesh.creation.cylinder(radius=radius,height=height,sections=sections)
    m.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[1,0,0]))
    m.apply_translation(center)
    return m

def cut_wood_profile(length=1.8, base_y=0.0, height=0.2, thickness=0.23, orientation="x", variation=0):
    """Extruded non-rectangular timber profile with concave curved tips, not real joinery.
    Approximate gong-like end silhouette with arc sampled, return watertight prism.
    """
    # Convex cross-section with six-point arc on each end, end upper-lift and undercut.
    half=length/2
    xy=[(-half+0.17,base_y), (half-0.17,base_y)]
    for t in np.linspace(0,1,7):
        # tip descends to narrow base, rises outward under a sculpted curved end
        xx = half - 0.17 + 0.17*t
        yy = base_y + 0.025 + 0.10*(t**1.8)
        xy.append((xx, yy))
    xy.extend([(half,base_y+height-0.035), (half-0.10,base_y+height),
               (-half+0.10,base_y+height),(-half,base_y+height-0.035)])
    for t in np.linspace(1,0,7):
        xx=-half + 0.17*(1-t)
        yy=base_y + 0.025+0.10*(t**1.8)
        xy.append((xx,yy))
    # Ear clipping triangulation (polygon need not be convex).
    return polygon_prism(xy, thickness, orientation)

def _polygon_area(points):
    return sum(p[0]*q[1]-q[0]*p[1] for p,q in zip(points,points[1:]+points[:1]))/2

def _triangulate(poly):
    pts=list(poly)
    if _polygon_area(pts)<0: pts.reverse()
    inds=list(range(len(pts)))
    faces=[]
    def cross(a,b,c):
        return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
    def inside(a,b,c,p):
        return cross(a,b,p)>=-1e-10 and cross(b,c,p)>=-1e-10 and cross(c,a,p)>=-1e-10
    for _ in range(len(inds)*len(inds)):
        if len(inds)==3:
            faces.append(tuple(inds));break
        found=False
        for j in range(len(inds)):
            a=inds[(j-1)%len(inds)];b=inds[j];c=inds[(j+1)%len(inds)]
            if cross(pts[a],pts[b],pts[c]) < 1e-9: continue
            if any(inside(pts[a],pts[b],pts[c],pts[k]) for k in inds if k not in (a,b,c)):
                continue
            faces.append((a,b,c));inds.pop(j);found=True;break
        if not found:
            raise ValueError("polygon ear clipping failed: self-intersection or redundant points")
    return pts,faces

def polygon_prism(points, thickness, orientation="x"):
    """points: (horizontal distance, vertical height); extrude 3D normal to profile."""
    # remove near duplicates and co-linear sampling noise via shapely simplify only if needed
    pts, caps = _triangulate(points)
    n=len(pts)
    vertices=[]
    for s in (-thickness/2, thickness/2):
        for xx, yy in pts:
            if orientation=="x": vertices.append([xx, yy, s])
            elif orientation=="z": vertices.append([s,yy,xx])
            else: raise ValueError(orientation)
    faces=[]
    for a,b,c in caps:
        faces.append((c,b,a));faces.append((a+n,b+n,c+n))
    for i in range(n):
        j=(i+1)%n
        faces.extend([(i,j,j+n),(i,j+n,i+n)])
    m=trimesh.Trimesh(vertices=vertices,faces=faces,process=True)
    m.fix_normals()
    return m

def place(mesh, center):
    m=mesh.copy();m.apply_translation(center);return m

def tilt_angled_beam(direction="z"):
    # 'Ang' bracket tail: visible long rising/slanted section with enlarged carved tip.
    profile=[(-0.48,0.70),(-0.20,0.73),(0.22,0.91),(0.91,1.07),(1.10,1.16),
             (1.28,1.17),(1.28,1.32),(1.07,1.30),(0.69,1.22),(0.08,1.10),
             (-0.46,0.89)]
    return polygon_prism(profile,0.25,direction)

def bracket_study():
    out=Asset()
    out.add(y_cylinder(0.245,1.26,(0,-0.69,0),32),"column_head_fragment","aged_wood","column")
    out.add(y_cylinder(0.285,0.07,(0,-0.03,0),16),"column_collar","wood_shadow","column")
    # primary bearing dou; waist+flares to visually distinguish blocks from rectangular stacks
    for label,r,y,h in [("bearing_base",0.30,0.05,0.16),("bearing_waist",0.195,0.16,0.13),
                        ("bearing_head",0.32,0.275,0.12)]:
        out.add(y_cylinder(r,h,(0,y,0),8),label,"red_wood","bearing_dou")
    out.add(box(0.49,0.085,0.49,(0,0.35,0)),"bearing_cap","end_grain","bearing_dou")
    # primary transverse bracket arm / hua gong
    out.add(cut_wood_profile(1.64,base_y=0.40,height=0.21,thickness=0.29),
            "first_gong_east_west","aged_wood","gong")
    # under-beam accents carved at ends, nonstructural profile studies
    for x in (-0.69,0.69):
        out.add(box(0.21,0.035,0.29,(x,0.63,0)),"gong_end_lintel","wood_shadow","gong")
        out.add(y_cylinder(0.155,0.145,(x,0.72,0),8),"sculpted_end_dou","end_grain","bearing_dou")
    out.add(cut_wood_profile(1.45,base_y=0.72,height=0.20,thickness=0.28,orientation="z"),
            "second_gong_front_back","red_wood","gong")
    for z in (-0.63,0.63):
        out.add(y_cylinder(0.15,0.14,(0,1.02,z),8),"front_back_dou","end_grain","bearing_dou")
    # sloped 'ang' and upward-projecting back tail illustrative, not a verified six-puzuo system
    out.add(tilt_angled_beam("z"),"forward_fake_ang_inclined","aged_wood","ang")
    out.add(place(tilt_angled_beam("x"),(-0.05,0.06,-0.05)),"transverse_link_study","wood_shadow","ang")
    out.add(cut_wood_profile(2.2,base_y=1.24,height=0.19,thickness=0.26),
            "upper_linggong","red_wood","upper_linggong")
    for x in (-0.96,0.96):
        out.add(y_cylinder(0.135,0.14,(x,1.50,0),8),"upper_dou","end_grain","bearing_dou")
    out.add(box(2.45,0.18,0.34,(0,1.62,0)),"eave_purlin_fragment","aged_wood","eave_purlin")
    out.add(box(2.60,0.055,0.40,(0,1.74,0)),"eave_sill_thin_cap","wood_shadow","eave_purlin")
    # Mortise visible in small demo as inset-like dark slot, not engineering-qualified joint
    out.add(box(0.20,0.03,0.24,(0,1.755,0)),"joint_locator_unverified","wood_shadow","joint_study")
    path=out.export("zhenru_bracket_research.glb")
    return out,path

def roof_y(x,z):
    # 26 degree pitch: public overview value, geometry profile below is still illustrative.
    pitch=math.tan(math.radians(26.0))
    eavekick = 0.20 * ((max(0.0, z-2.36) / .84)**2)
    sidekick = 0.055 * (abs(x)/1.85)**4
    return 2.20 - pitch*z + eavekick + sidekick

def tile_surface(cx,z0,z1,width,style, thickness=0.023, n_x=12,n_z=5, overlap=0):
    """Generate real thickness curved plate tiles as watertight mesh."""
    # pan tile: gutter shaped centre depression; cover tile: semicircular positive curl
    verts=[]; faces=[]
    for side in (0,1):
        for j in range(n_z+1):
            z=z0+(z1-z0)*j/n_z
            for i in range(n_x+1):
                u=-1+2*i/n_x
                x=cx+u*width/2
                if style=="pan":
                    lift=.035 * (u*u) + .015
                else:
                    lift=0.028 + 0.090*math.sqrt(max(0,1-u*u))
                y=roof_y(x,z) + lift + overlap - side*thickness
                verts.append((x,y,z))
    row=n_x+1;layer=row*(n_z+1)
    for j in range(n_z):
        for i in range(n_x):
            a=j*row+i;b=a+1;c=a+row;d=c+1
            faces.extend([(a,c,b),(b,c,d),(layer+a,layer+b,layer+c),(layer+b,layer+d,layer+c)])
    # sides: close every exposed edge, real thin shell rather than a single-sided sheet
    edges=[]
    for i in range(n_x): edges.append((i,i+1))
    for j in range(n_z): edges.append((j*row+n_x,(j+1)*row+n_x))
    for i in range(n_x,0,-1): edges.append((n_z*row+i,n_z*row+i-1))
    for j in range(n_z,0,-1): edges.append((j*row,(j-1)*row))
    for a,b in edges:faces.extend([(a,b,layer+a),(b,layer+b,layer+a)])
    m=trimesh.Trimesh(vertices=verts,faces=faces,process=False)
    m.fix_normals()
    return m

def coarse_surface(x0,x1,z0,z1,lower_offset, n_x=32,n_z=28):
    vs=[];fs=[]
    for j in range(n_z+1):
        z=z0+(z1-z0)*j/n_z
        for i in range(n_x+1):
            x=x0+(x1-x0)*i/n_x
            vs.append((x,roof_y(x,z)+lower_offset,z))
    for j in range(n_z):
        for i in range(n_x):
            a=j*(n_x+1)+i;b=a+1;c=a+(n_x+1);d=c+1
            fs.extend([(a,c,b),(b,c,d)])
    m=trimesh.Trimesh(vertices=vs, faces=fs,process=False)
    m.fix_normals();return m

def combine(meshes):
    return trimesh.util.concatenate(meshes)

def roof_eave_study():
    out=Asset()
    X0=-1.84;X1=1.84; Z0=0.02;Z1=3.15
    # Multiple 3D materials, not fake texture stripes.
    out.add(coarse_surface(X0,X1,Z0,Z1,lower_offset=-0.07),"wooden_roof_underlay","aged_wood","roof_underlay")
    out.add(coarse_surface(X0,X1,Z0,Z1,lower_offset=-0.044),"tile_bedding_base","mortar","roof_underlay")
    # 16 cover rows and 17 drainage pan rows; 12 overlapped courses each, grouped by kind
    lane_w=.231
    pan_centers=np.linspace(X0+.06,X1-.06,16)
    cap_centers=(pan_centers[1:]+pan_centers[:-1])/2
    pans=[];caps=[];pan_alt=[];cap_alt=[]
    courses=11
    for j in range(courses):
        # Slight front-to-back overlap; coverage ensures no obvious seam from 3D orbit
        z0=Z0 + (Z1-Z0)*j/courses
        z1=Z0 + (Z1-Z0)*(j+1)/courses + (0.043 if j<courses-1 else 0)
        for i,cx in enumerate(pan_centers):
            m=tile_surface(cx,z0,z1,lane_w*1.02,"pan",overlap=.002 if j%2 else .005)
            (pan_alt if (i+j)%5==0 else pans).append(m)
        for i,cx in enumerate(cap_centers):
            m=tile_surface(cx,z0,z1,lane_w*.57,"cap",overlap=.006 if j%2 else .010)
            (cap_alt if (i+j)%7==0 else caps).append(m)
    out.add(combine(pans),"pan_tile_field","tile_cool","individual_pan_tiles")
    out.add(combine(pan_alt),"pan_tile_slight_variation","dark_tile","individual_pan_tiles")
    out.add(combine(caps),"cover_tile_field","dark_tile","individual_cover_tiles")
    out.add(combine(cap_alt),"cover_tile_slight_variation","tile_high","individual_cover_tiles")
    # Wood rafters that visually terminate at the curved flying eave
    for i,x in enumerate(np.linspace(X0+.16,X1-.16,11)):
        points=np.linspace(Z0,Z1+.15,28)
        # sampled beam underneath tile bed; approx 0.09m square profile
        vs=[];fs=[]
        for j,z in enumerate(points):
            for xx,yy in ((-.055,-.19),(.055,-.19),(.055,-.11),(-.055,-.11)):
                vs.append((x+xx,roof_y(x,z)+yy,z))
            if j>0:
                for k in range(4):
                    a=(j-1)*4+k;b=(j-1)*4+(k+1)%4;c=j*4+k;d=j*4+(k+1)%4
                    fs.extend([(a,c,b),(b,c,d)])
        fs.extend([(0,2,1),(0,3,2)])
        a=(len(points)-1)*4;fs.extend([(a,a+1,a+2),(a,a+2,a+3)])
        out.add(trimesh.Trimesh(vertices=vs,faces=fs,process=True),f"curved_rafter_{i:02d}",
                "aged_wood","rafters")
    # Ridge as a thick physical cylinder on X axis; visible from oblique angles.
    ridge=y_cylinder(0.10,X1-X0+.28,center=(0,roof_y(0,Z0)+.10,Z0),sections=18)
    ridge.apply_transform(trimesh.transformations.rotation_matrix(math.pi/2,[0,0,1],point=[0,roof_y(0,Z0)+.10,Z0]))
    out.add(ridge,"sample_ridge_cap_horizontal","tile_high","ridge_study")
    # Eave edge rounded course and tile end-cap (actual 3D cylinders)
    for i,cx in enumerate(cap_centers):
        z=Z1+0.010;y=roof_y(cx,z)+.04
        out.add(y_cylinder(.069,.033,(cx,y,z),12),f"tile_endcap_{i:02d}","tile_high","eave_tips")
    path=out.export("zhenru_roof_tile_eave_research.glb")
    return out,path

def main():
    br,brpath=bracket_study()
    rf,rfpath=roof_eave_study()
    manifest={
        "project":"Zhenru Temple / detail research kit v1",
        "not_measured_restoration":True,
        "coordinate_system":"meters, X horizontal, Y up, Z depth",
        "bracket": {"file":brpath.name,"component_count":len(br.records),"components":br.records,
                    "note":"four-puzuo interpretive bracket morphology study; NOT an identified real historical bracket"},
        "roof": {"file":rfpath.name,"component_count":len(rf.records),"components":rf.records,
                 "note":"3.68m x 3.15m roof-eave research patch with physically thick overlapping pan/cover tile meshes"},
        "evidence_level":"geometric study, based on publicly reported categories only; dimensions not surveyed",
        "architecture_references":[
            "https://www.shpt.gov.cn/zrzjd-jiedaozhen/bmts-zrzjd/20250407/958347.html",
            "https://www.thepaper.cn/newsDetail_forward_26636609",
            "https://www.meet-in-shanghai.net/cn/national-key-cultural-relics-protection-unit/it-is-really-like-the-main-hall-of-the-temple-415416/"
        ]
    }
    (BASE/'asset_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    for name,p,study in [('bracket',brpath,br),('roof',rfpath,rf)]:
        loaded=trimesh.load(p,force='scene')
        triangles=sum(len(g.faces) for g in loaded.geometry.values())
        print(name,'GLB',p.stat().st_size,'bytes',len(loaded.geometry),'geometry nodes',triangles,'triangles',
              'watertight',sum(int(g.is_watertight) for g in loaded.geometry.values()),'/',len(loaded.geometry))
    print('MANIFEST',BASE/'asset_manifest.json')

if __name__=='__main__':
    main()