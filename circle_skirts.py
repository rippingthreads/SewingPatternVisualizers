# find:
#   pattern dimensions (inner_radius, outer_radius, theta)
#   secondary stuff (total area, bounding rectangle)
# given: ("a/b", waist circumfrence, length, ease)
import math, os
from PIL import Image, ImageDraw

image_size = 256, 256
output_path = os.path.join(os.getcwd(), "skirt_output.png")

class circle:
    def __init__(self, num, denom, waist, length, ease):
        self.num = num
        self.denom = denom
        self.waist = waist
        self.length = length
        self.ease = ease

        self.inner_radius = ((waist+ease)*denom)/(2*num*math.pi)
        self.outer_radius = self.inner_radius + length
        self.theta = (num * math.pi) / (2*denom)

        self.edge_bbox = get_edge_bbox(self)
        self.symmetric_bbox = get_tangent_bbox(self)
        self.scale_factor = image_size[0] / (self.outer_radius)

    def draw(self):
        #center of pattern = center of image
        with Image.new("RGB", image_size, "white") as im:
            draw = ImageDraw.Draw(im)

            #draw pattern
            #convert angles to degrees
            angle1 = 360-math.degrees(self.theta)
            angle2 = 360
            #offset = (image_size[0]/2, image_size[1]/2)
            offset = (0, 0)
            sector_bbox = rescale_points(points_to_bbox(self.edge_bbox), self.scale_factor, offset=offset)
            print(sector_bbox)
            draw.pieslice(sector_bbox, angle1, angle2, fill="black")
            #draw edge bbox
            draw.polygon(rescale_points(self.edge_bbox, self.scale_factor, offset=offset), outline="red")
            #draw symmetric bbox if it is more efficent
            if get_points_area(self.symmetric_bbox) < get_points_area(self.edge_bbox):
                draw.polygon(rescale_points(self.symmetric_bbox, self.scale_factor, offset=offset), outline="blue")
            im.save(output_path, "PNG")

#coordinate/point operations
def rescale_points(point_list: tuple, scale_factor: float, offset: tuple = (0, 0)) -> tuple:
    point_list_scaled = [tuple([coord * scale_factor + offset[i] for i, coord in enumerate(point)]) for point in point_list]
    point_list_scaled = tuple(point_list_scaled)
    return point_list_scaled 

def get_points_area(point_list: tuple) -> float:
    #calculate the area of a polygon given its vertices
    x0, y0 = point_list[0]
    area = 0.0
    for i in range(1, len(point_list)):
        x1, y1 = point_list[i]
        area += (x1 * y0 - x0 * y1)
    return abs(area) / 2.0

def points_to_bbox(point_list: tuple) -> tuple:
    #convert 4 points into a 2 point bbox
    x_min = min(point[0] for point in point_list)
    y_min = min(point[1] for point in point_list)
    x_max = max(point[0] for point in point_list)
    y_max = max(point[1] for point in point_list)
    return ((x_min, y_min), (x_max, y_max))

#bounding box operations
def get_edge_bbox(skirt: circle) -> tuple:
    #gets the edge-aligned bbox possilbe from the sector given
    #returns bottom left, top right corner
    x1, x2, y1, y2 = [None]*4

    x1 = skirt.inner_radius*math.cos(skirt.theta)
    y1=0
    x2 = skirt.outer_radius
    y2 = skirt.outer_radius*math.sin(skirt.theta)

    return ((x1, y1), (x1, y2), (x2, y2), (x2, y1))

def get_tangent_bbox(skirt: circle) -> tuple:
    #gets each corner of the smallest rectangle that is tangent to the outer arc of the sector
    x1, x2, y1, y2 = [None]*4

    #find edge lengths for the tangent bbox
    # length of edge tangent to outer arc
    d1 = 2 * skirt.outer_radius * math.sin(skirt.theta / 2)
    # length between outside tangent edge and inner edge
    d2  = math.dist(
        (skirt.outer_radius, 0), 
        (skirt.outer_radius*math.cos(skirt.theta), skirt.outer_radius*math.cos(skirt.theta)))

    #calculate the cooridnates of the bbox so the sector fits inside it
    x1 = skirt.outer_radius*math.cos(skirt.theta/2) - d2/2
    y1 = skirt.outer_radius*math.sin(skirt.theta/2) - d1/2
    x2 = skirt.outer_radius*math.cos(skirt.theta/2) + d2/2
    y2 = skirt.outer_radius*math.sin(skirt.theta/2) - d1/2
    x3 = skirt.outer_radius*math.cos(skirt.theta/2) + d2/2
    y3 = skirt.outer_radius*math.sin(skirt.theta/2) + d1/2
    x4 = skirt.outer_radius*math.cos(skirt.theta/2) - d2/2
    y4 = skirt.outer_radius*math.sin(skirt.theta/2) + d1/2

    return ((x1, y1), (x2, y2), (x3, y3), (x4, y4))

    

s1 = circle(1, 2, 28, 25, 1)
s1.draw()
print(s1.inner_radius, s1.outer_radius, s1.theta)
        