import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import GUI from 'lil-gui';

// TODO: Turn the scene to an AR scene
// TODO: Play sounds
// TODO: Possibly get the car animation working (optional)
// TODO: Improve textures where needed
// TODO: Make sure everything looks good, with no visible glitches
// TODO: Add a Grader's Note explaining every little detail

// Classes for the GUI
class ColorGUIHelper {
    constructor(object, prop) {
        this.object = object;
        this.prop = prop;
    }
    get value() {
        return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
        this.object[this.prop].set(hexString);
    }
}
class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
        this.minDif = minDif;
    }
    get min() {
        return this.obj[this.minProp];
    }
    set min(v) {
        this.obj[this.minProp] = v;
        this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() {
        return this.obj[this.maxProp];
    }
    set max(v) {
        this.obj[this.maxProp] = v;
        this.min = this.min;
    }
}
    

// Global variables
let roadCubes = [[]];
let grassCubesOne = [[]];
let grassCubesTwo = [[]];
let vehicleCubes = [[]];
let vehicleSpheres = [[]];
let vehicleCylinders = [[]];
let spheres = [[]];


// Texture helper function
function loadTexture(path, options = {}) {
    const texture = new THREE.TextureLoader().load(path);
    Object.assign(texture, options);
    return texture;
}


// Main function
function main() {
    // Creating the canvas and renderer
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Creating the scene
    const scene = new THREE.Scene();

    // Creating the perspective camera
    const camera = initCamera(canvas);

    // Creating the orbit controls
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    // Creating the ground plane
    const plane = initPlane();
    scene.add(plane);

    // Creating the three lights and the GUI for it
    const lights = initLights(scene);
    const gui = initGUI(lights, camera);

    // Creating the ground road
    road(scene);
    
    // Creating the ground grass
    grass(scene);
    
    // Creating the vehicle
    vehicle(scene);

    // Creating the Sun
    sun(scene);

    // Loading in the OBJ models
    loadModels(scene);

    // Calling the animation rendering loop
    animate(renderer, scene, camera, controls);
}


// Road initalization helper function
function road(scene) {
    // Creating the texture for the road cubes
    const roadTexture = loadTexture('road.jpg', {
        colorSpace: THREE.SRGBColorSpace,
    }); // The texture is Untitled on Pexels by "Life of Pix"

    // Setting the road cubes' values
    const roadCubeWidth = 5;
    const roadCubeHeight = 0.5;
    const roadCubeDepth = 5;
    const roadCubeGeometry = new THREE.BoxGeometry(roadCubeWidth, roadCubeHeight, roadCubeDepth);

    function makeRoadCubeInstance(cubeGeometry, x, y, z, texture) { // Internal function to create a road made up of three cubes stuck together
        const material = new THREE.MeshBasicMaterial({ map: texture }); // Coloring the cubes, which are affected by lights
        const cubes = []; // The return array
        // Cube One, the center cube
        const cubeOne = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        cubeOne.receiveShadow = true;
        scene.add(cubeOne);
        cubeOne.position.x = x;
        cubeOne.position.y = y;
        cubeOne.position.z = z;
        cubes.push(cubeOne);
        // Cube Two, the left cube
        const cubeTwo = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        cubeTwo.receiveShadow = true;
        scene.add(cubeTwo);
        cubeTwo.position.x = x - 5;
        cubeTwo.position.y = y;
        cubeTwo.position.z = z;
        cubes.push(cubeTwo);
        // Cube Three, the right cube
        const cubeThree = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        cubeThree.receiveShadow = true;
        scene.add(cubeThree);
        cubeThree.position.x = x + 5;
        cubeThree.position.y = y;
        cubeThree.position.z = z;
        cubes.push(cubeThree);
        return cubes;
    }

    // Creating the road through road cubes
    roadCubes = [
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, -25.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, -20.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, -15.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, -10.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, -5.00001, roadTexture),
        // Center of the road
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, 0.00001, roadTexture),
        // Positive z-side of the road
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, 5.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, 10.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, 15.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, 20.00001, roadTexture),
        makeRoadCubeInstance(roadCubeGeometry, 0.00001, -0.05, 25.00001, roadTexture),
    ];
}

// Grass initalization helper function
function grass(scene) {
    // Creating the texture for the grass cubes, which are based off road cubes
    const grassTexture = loadTexture('grass.jpeg', {
        colorSpace: THREE.SRGBColorSpace,
    }); // The texture is "Green Grass" on Pexels by "Mike Fallarme"

    // Setting the road cubes' values
    const roadCubeWidth = 5;
    const roadCubeHeight = 0.5;
    const roadCubeDepth = 5;
    const roadCubeGeometry = new THREE.BoxGeometry(roadCubeWidth, roadCubeHeight, roadCubeDepth);

    function makeRoadCubeInstance(cubeGeometry, x, y, z, texture) { // Internal function to create a road made up of three cubes stuck together
        const material = new THREE.MeshBasicMaterial({ map: texture }); // Coloring the cubes, which are affected by lights
        const cubes = []; // The return array
        // Cube One, the center cube
        const cubeOne = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        cubeOne.receiveShadow = true;
        scene.add(cubeOne);
        cubeOne.position.x = x;
        cubeOne.position.y = y;
        cubeOne.position.z = z;
        cubes.push(cubeOne);
        // Cube Two, the left cube
        const cubeTwo = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        cubeTwo.receiveShadow = true;
        scene.add(cubeTwo);
        cubeTwo.position.x = x - 5;
        cubeTwo.position.y = y;
        cubeTwo.position.z = z;
        cubes.push(cubeTwo);
        // Cube Three, the right cube
        const cubeThree = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        cubeThree.receiveShadow = true;
        scene.add(cubeThree);
        cubeThree.position.x = x + 5;
        cubeThree.position.y = y;
        cubeThree.position.z = z;
        cubes.push(cubeThree);
        return cubes;
    }


    // Creating the grass through two grass cubes
    grassCubesOne = [
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, -25.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, -20.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, -15.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, -10.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, -5.00001, grassTexture),
        // Center of the road
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, 0.00001, grassTexture),
        // Positive z-side of the road
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, 5.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, 10.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, 15.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, 20.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, -15.00001, -0.05, 25.00001, grassTexture),
    ];
    grassCubesTwo = [
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, -25.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, -20.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, -15.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, -10.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, -5.00001, grassTexture),
        // Center of the road
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, 0.00001, grassTexture),
        // Positive z-side of the road
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, 5.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, 10.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, 15.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, 20.00001, grassTexture),
        makeRoadCubeInstance(roadCubeGeometry, 15.00001, -0.05, 25.00001, grassTexture),
    ];
}


// Vehicle initalization helper function
function vehicle(scene) {
    // Creating the texture for the vehicle body cube
    const vehicleBodyTexture = loadTexture('coca-cola-truck-container.jpeg', {
        colorSpace: THREE.SRGBColorSpace,
    }); // The texture is a modified version of "a coca-cola truck on the street" on Unsplash by "AXP Photography"
    // Creating the texture for the vehicle body cylinder
    const vehicleCylinderTexture = loadTexture('coca-cola-can.jpg', {
        colorSpace: THREE.SRGBColorSpace,
    }); // The texture is a modified version of "Red Can of Coca-Cola Zero on the Corner of a Table" on Pexels by "Rohit Sharma"
   
    // Setting the cube's values
    const boxWidth = 5; // Default: 1
    const boxHeight = 3; // Default: 1
    const boxDepth = 15; // Default: 1
    const cubeGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth); // Creating the cube
    
    // Setting the vehicle sphere's values
    const vehicleSphereRadius = 1; // Default: 1
    const vehicleSphereWidthSegments = 32; // Default: 32
    const vehicleSphereVerticalSegments = 16; // Default: 16
    const vehicleSphereGeometry = new THREE.SphereGeometry(vehicleSphereRadius, vehicleSphereWidthSegments, vehicleSphereVerticalSegments); // Creating the sphere
    
    // Setting the sphere's values
    const sphereRadius = 2; // Default: 1
    const sphereWidthSegments = 32; // Default: 32
    const sphereVerticalSegments = 16; // Default: 16
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, sphereWidthSegments, sphereVerticalSegments); // Creating the sphere
    
    // Setting the vehicle sphere's vlaues
    const cylinderRadiusTop = 1;
    const cylinderRadiusBottom = 1;
    const cylinderHeight = 5;
    const cylinderRadialSegments = 32;
    const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadiusTop, cylinderRadiusBottom, cylinderHeight, cylinderRadialSegments);

    function makeVehicleCubeInstance(cubeGeometry, x, y, z, givenTexture) { // Internal function to create the vehicle's body cube
        const material = new THREE.MeshBasicMaterial({ map: givenTexture }); // Texturing the cube which is not affected by lights
        const cube = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        cube.castShadow = true;
        scene.add(cube);
        cube.position.x = x;
        cube.position.y = y;
        cube.position.z = z;
        return cube;
    }

    function makeVehicleSphereInstance(sphereGeometry, color, x, y, z) { // Internal function to create spheres to act as tires for the vehicle
        const material = new THREE.MeshPhongMaterial({ color }); // Coloring the sphere which is affected by lights
        const spheres = []; // The return array
        // Sphere One at the top-left
        const sphereOne = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        sphereOne.castShadow = true;
        scene.add(sphereOne);
        sphereOne.position.x = x - 2.5;
        sphereOne.position.y = y;
        sphereOne.position.z = z + 7;
        spheres.push(sphereOne);
        // Sphere Two at the top-right
        const sphereTwo = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        sphereTwo.castShadow = true;
        scene.add(sphereTwo);
        sphereTwo.position.x = x + 2.5;
        sphereTwo.position.y = y;
        sphereTwo.position.z = z + 7;
        spheres.push(sphereTwo);
        // Sphere Three at the back-left
        const sphereThree = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        sphereThree.castShadow = true;
        scene.add(sphereThree);
        sphereThree.position.x = x - 2.5;
        sphereThree.position.y = y;
        sphereThree.position.z = z - 7;
        spheres.push(sphereThree);
        // Sphere Four at the back-right
        const sphereFour = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        sphereFour.castShadow = true;
        scene.add(sphereFour);
        sphereFour.position.x = x + 2.5;
        sphereFour.position.y = y;
        sphereFour.position.z = z - 7;
        spheres.push(sphereFour);
        return spheres;
    }

    function makeVehicleCylinderInstance(cylinderGeometry, givenTexture, x, y, z) { // Internal function to create the cylinder for the vehicle
        const material = new THREE.MeshBasicMaterial({ map: givenTexture }); // Texturing the cylinder which is not affected by lights
        const cylinder = new THREE.Mesh(cylinderGeometry, material); // Creating the mesh for the cylinder
        cylinder.castShadow = true;
        scene.add(cylinder);
        cylinder.position.x = x;
        cylinder.position.y = y;
        cylinder.position.z = z;
        return cylinder;
    }

    // Creating the textured body of the vehicle though a cube
    const vehicleCubes = [
        makeVehicleCubeInstance(cubeGeometry, 0, 3, -15, vehicleBodyTexture),
    ];
    
    // Creating the black tires for the vehicle through spheres
    const vehicleSpheres = [
        makeVehicleSphereInstance(vehicleSphereGeometry, 0x000000, 0, 0.75, -15),
    ];

    // Creating the textured cylinder on top of the vehicle
    const vehicleCylinders = [
        makeVehicleCylinderInstance(cylinderGeometry, vehicleCylinderTexture, 0, 5, -10),
    ];
}


// Sun initalization helper function
function sun(scene) {
    // Setting the sphere's values
    const sphereRadius = 2; // Default: 1
    const sphereWidthSegments = 32; // Default: 32
    const sphereVerticalSegments = 16; // Default: 16
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, sphereWidthSegments, sphereVerticalSegments); // Creating the sphere

    function makeSphereInstance(sphereGeometry, color, x, y, z) { // Internal function to create spheres
        const material = new THREE.MeshPhongMaterial({ color }); // Coloring the sphere which is affected by lights
        const sphere = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        sphere.castShadow = true;
        scene.add(sphere);
        sphere.position.x = x;
        sphere.position.y = y;
        sphere.position.z = z;
        return sphere;
    }

    const spheres = [
        makeSphereInstance(sphereGeometry, 0xF9D71C, -30, 15, -30), // Using the Krylon Sun Yellow color
    ];
}


// Camera helper function
function initCamera(canvas) {
    const fov = 45;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const near = 0.1;
    const far = 200;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    return camera;
}


// Ground plane helper function
function initPlane() {
    const planeSize = 45;
    const texture = loadTexture('checker.png', {
        wrapS: THREE.RepeatWrapping,
        wrapT: THREE.RepeatWrapping,
        magFilter: THREE.NearestFilter,
        repeat: new THREE.Vector2(planeSize / 2, planeSize / 2),
    });
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = -0.5 * Math.PI;
    mesh.receiveShadow = true;
    
    return mesh;
}


// Lights helper function
function initLights(scene) {
    // White ambient light
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.1);
    scene.add(ambientLight);

    // Sky blue and grass hemisphere light 
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x7CFC00, 0.4);
    scene.add(hemisphereLight);
   
    // Sunlight hemisphere light
    const directionalLight = new THREE.DirectionalLight(0xFDFBD3, 1);
    directionalLight.position.set(-30, 15, -30);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    return { directionalLight, ambientLight, hemisphereLight };
}


// GUI helper function
function initGUI(lights, camera) {
    const gui = new GUI();
    
    // Camera GUI
    gui.add(camera, 'fov', 1, 180).onChange(() => camera.updateProjectionMatrix());
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(() => camera.updateProjectionMatrix());
    gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(() => camera.updateProjectionMatrix());
    
    // Ambient light GUI
    gui.addColor(new ColorGUIHelper(lights.ambientLight, 'color'), 'value').name('Ambient Light Color');
    gui.add(lights.ambientLight, 'intensity', 0, 1, 0.01);

    // Hemisphere light GUI
    gui.addColor(new ColorGUIHelper(lights.hemisphereLight, 'color'), 'value').name('Sky Color');
    gui.addColor(new ColorGUIHelper(lights.hemisphereLight, 'groundColor'), 'value').name('Ground Color');
    gui.add(lights.hemisphereLight, 'intensity', 0, 2, 0.01);

    // Directional light GUI
    gui.addColor(new ColorGUIHelper(lights.directionalLight, 'color'), 'value').name('Directional Light Color');
    gui.add(lights.directionalLight, 'intensity', 0, 1, 0.01);
    gui.add(lights.directionalLight.position, 'x', -30, 30).name('Position X');
    gui.add(lights.directionalLight.position, 'y', 0, 30).name('Position Y');
    gui.add(lights.directionalLight.position, 'z', -30, 30).name('Position Z');

    return gui;
}


// OBJ models helper function
function loadModels(scene) {
    /* OBJ models nested array including: 
     * "Sports Car" by Quaternius on Poly.Pizza
     * "Mitsubishi L200" by Muhammad Reyhan [CC-BY] via Poly Pizza
     * "Bambo House" by tomaszcgb on free3D.com
     * "Traffic Light" by bazsa on free3D.com
     * "Tree02" by rezashams313 on free3D.com
     * "Table And Chairs" by emrecskn on free3D.com
    */
    const models = [
        { mtl: 'SportsCar.mtl', obj: 'SportsCar.obj', position: [0, 0.25, 0], scale: [1, 1, 1] },
        { mtl: 'SportsCar.mtl', obj: 'SportsCar.obj', position: [6, 0.25, 16], scale: [1, 1, 1] },
        { mtl: 'l200.mtl', obj: 'l200.obj', position: [6, 0.25, 0], scale: [2, 2, 2] },
        { mtl: 'l200.mtl', obj: 'l200.obj', position: [-4, 0.25, 22], scale: [2, 2, 2] },
        { mtl: 'Bambo_House.mtl', obj: 'Bambo_House.obj', position: [-21.5, 0.25, -13], scale: [1, 1, 1] },
        { mtl: 'Bambo_House.mtl', obj: 'Bambo_House.obj', position: [9, 0.25, -13], scale: [1, 1, 1] },
        { mtl: 'Bambo_House.mtl', obj: 'Bambo_House.obj', position: [-21.5, 0.25, 25], scale: [1, 1, 1] },
        { mtl: 'Bambo_House.mtl', obj: 'Bambo_House.obj', position: [9, 0.25, 25], scale: [1, 1, 1] },
        { mtl: 'trafficlight.mtl', obj: 'trafficlight.obj', position: [-8, 0.25, -26.5], scale: [1, 1, 1] },
        { mtl: 'trafficlight.mtl', obj: 'trafficlight.obj', position: [-8, 0.25, 26.5], scale: [1, 1, 1] },
        { mtl: 'Tree.mtl', obj: 'Tree.obj', position: [-16, 0.25, 0], scale: [1, 1, 1] },
        { mtl: 'Tree.mtl', obj: 'Tree.obj', position: [16, 0.25, 0], scale: [1, 1, 1] },
        { mtl: 'Table And Chairs.mtl', obj: 'Table And Chairs.obj', position: [16, 0.25, -8], scale: [0.03, 0.03, 0.03] },
        { mtl: 'Table And Chairs.mtl', obj: 'Table And Chairs.obj', position: [-16, 0.25, -8], scale: [0.03, 0.03, 0.03] },
        { mtl: 'Table And Chairs.mtl', obj: 'Table And Chairs.obj', position: [16, 0.25, 8], scale: [0.03, 0.03, 0.03] },
        { mtl: 'Table And Chairs.mtl', obj: 'Table And Chairs.obj', position: [-16, 0.25, 8], scale: [0.03, 0.03, 0.03] }
    ];

    // OBJ models nested array's loading loops
    models.forEach(({ mtl, obj, position, scale }) => {
        const mtlLoader = new MTLLoader();
        mtlLoader.load(mtl, (mtl) => {
            mtl.preload();
            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load(obj, (root) => {
                root.position.set(...position);
                root.scale.set(...scale);
                root.castShadow = true;
                scene.add(root);
            });
        });
    });
}

// Animation loop helper function
function animate(renderer, scene, camera, controls) {
    // Internal canvas resize function
    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const height = canvas.clientHeight;
        const width = canvas.clientWidth;
        const needResize = canvas.height !== height || canvas.width !== width;
        if (needResize) {
            renderer.setSize(width, height, false);
        }

        return needResize;
    }

    // Internal scene rendering function
    function render(time) {
        // Setting the tick rate
        time *= 0.001;

        // Handling the resize when needed
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // Rendering the road cubes
        roadCubes.forEach((cubes, ndx) => {
            cubes.forEach((cube) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
            });
        });

        grassCubesOne.forEach((cubes, ndx) => {
            cubes.forEach((cube) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
            });
        });
        grassCubesTwo.forEach((cubes, ndx) => {
            cubes.forEach((cube) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
            });
        });

        // For the vehicle
       vehicleCubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
        });
        vehicleSpheres.forEach((spheres, ndx) => {
            spheres.forEach((sphere) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
                sphere.rotation.x = rot;
                sphere.rotation.y = rot;
            });
        });
        vehicleCylinders.forEach((cylinders, ndx) => {
        });
        
        // For the Sun
        spheres.forEach((sphereOne, ndx) => {
            sphereOne.forEach((sphereTwo) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
                sphere.rotation.x = rot;
                sphere.rotation.y = rot;
            });
        });

        // Creating the texture for the skybox/background with the "Tears Of Steel Bridge" By Greg Zaal Of Poly Haven
        const loader = new THREE.TextureLoader();
        const bgTexture = loader.load('Tears_Of_Steel_Bridge_2k.jpg', () => {
            bgTexture.mapping = THREE.EquirectangularReflectionMapping;
            bgTexture.colorSpace = THREE.SRGBColorSpace;
            scene.background = bgTexture;
        });
        bgTexture.colorspace = THREE.SRGBColorSpace;

        // Rendering the scene with the updated controls
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }

    // Frame update call
    requestAnimationFrame(render);
}

main(); // Initialize the scene
