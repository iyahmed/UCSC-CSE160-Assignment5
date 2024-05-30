import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import GUI from 'lil-gui';

// TODO: Improve the vehicle's textures
// TODO: Make houses on the side of the road (using a house instance function)
// TODO: Texture the Sun
// TODO: Make the directional light come from the Sun's direction by default
// TODO: Add an animation moving both the car and the vehicle forward by different paces, only stopping at the end of the road, to simulate a chase
// TODO: Add a stoplight OBJ, with it being red at all times, and position at the end of the road
// TODO: Add trees to side of the road, placed on top of the grasses
// TODO: Improve the skybox, making sure it shows something at all directions
// TODO: Cleanup the code and split logic into different functions and files

// Color editor class using lil-gui
class ColorGUIHelper {
    constructor(object, prop) {
        this.object = object;
        this.prop = prop;
    }
    get value() {
        return '#${this.object[this.prop].getHexString()}';
    }
    set value(hexString) {
        this.object[this.prop].set(hexString);
    }
}
// Camera editor class using lil-gui
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


function main() {
    // Creating the canvas and the renderer
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });


    // Creating the camera to start to point to the origin
    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();


    // Creating the gray checkerboard ground plane
    const planeSize = 45; // Originally 40
    const loader = new THREE.TextureLoader();
    const texture = loader.load('checker.png');
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    texture.repeat.set(repeats, repeats);
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSize,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    const textureLoader = new THREE.TextureLoader();
    // Creating the texture for the road cubes
    const roadTexture = textureLoader.load('road.jpg'); // The texture is Untitled on Pexels by "Life of Pix"
    roadTexture.colorSpace = THREE.SRGBColorSpace;
    // Creating the texture for the grass cubes
    const grassTexture = textureLoader.load('grass.jpeg'); // The texture is "Green Grass" on Pexels by "Mike Fallarme"
    grassTexture.colorSpace = THREE.SRGBColorSpace;
    // Creating the texture for the vehicle body cube
    const vehicleBodyTexture = textureLoader.load('coca-cola-truck-container.jpeg'); // The texture is a modified version of "a coca-cola truck on the street" on Unsplash by "AXP Photography"
    vehicleBodyTexture.colorSpace = THREE.SRGBColorSpace;
    // Creating the texture for the vehicle body cylinder
    const vehicleCylinderTexture = textureLoader.load('coca-cola-can.jpg'); // The texture is a modified version of "Red Can of Coca-Cola Zero on the Corner of a Table" on Pexels by "Rohit Sharma"
    vehicleCylinderTexture.colorSpace = THREE.SRGBColorSpace;


    // Adding directional lighting to the scene
    const directionalLightColor = 0xFFCC33; // Sunglow at sunset color
    const directionalLightIntensity = 1;
    const directionalLight = new THREE.DirectionalLight(directionalLightColor, directionalLightIntensity);
    directionalLight.position.set(0, 10, 0); // Setting the default position of the light
    // Adding the directional light's helper to the scene for debugging purposes
//    const helper = new THREE.DirectionalLightHelper(directionalLight);
    // Adding a mild ambient light to the scene
    const ambientLightColor = 0xFFFFFF; // White color
    const ambientLightIntensity = 0.1;
    const ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity);
    // Adding a hemisphere light to the scene
    const hemisphereSkyColor = 0xB1E1FF; // Sky blue
    const hemisphereGroundColor = 0xB97A20; // Ground brown orange
    const hemisphereIntensity = 1;
    const hemisphereLight = new THREE.HemisphereLight(hemisphereSkyColor, hemisphereGroundColor, hemisphereIntensity);
    // Adding a light GUI so the user can manipulate the lights
    function makeXYZGUI(gui, vector3, name, onChangeFn) { // Internal function to make generic light GUIs
        const folder = gui.addFolder(name);
        folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
        folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
        folder.add(vector3, 'z', - 10, 10).onChange(onChangeFn);
        folder.open();
    }
    function updateLight() { // Internal function to repeatably update the directional light and the helper light
        directionalLight.target.updateMatrixWorld();
//        helper.update();
    }
    // Allowing the user to manipulate the directional lighting and its helper
    const gui = new GUI();
    gui.addColor(new ColorGUIHelper(directionalLight, 'color'), 'value').name('Directional Light Color');
    gui.add(directionalLight, 'intensity', 0, 1, 0.01);
    makeXYZGUI(gui, directionalLight.position, 'position', updateLight);
    makeXYZGUI(gui, directionalLight.target.position, 'position', updateLight);
    // Allowing the user to manipulate the ambient lighting
    gui.addColor(new ColorGUIHelper(ambientLight, 'color'), 'value').name('Ambient Light Color');
    gui.add(ambientLight, 'intensity', 0, 1, 0.01);
    // Allowing the user to manipulate the hemisphere lighting
    gui.addColor(new ColorGUIHelper(hemisphereLight, 'color'), 'value').name('skyColor');
    gui.addColor(new ColorGUIHelper(hemisphereLight, 'groundColor'), 'value').name('groundColor');
    gui.add(hemisphereLight, 'intensity', 0, 2, 0.01);
    // Creating the orbiting camera
    function updateCamera() { // Internal function to constantly update the camera
        camera.updateProjectionMatrix();
    }
    gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);


    // Adding a OBJ file of "Sports Car" by Quaternius on Poly.Pizza to the scene
    {
        const mtlLoader = new MTLLoader();
        const objLoader = new OBJLoader();
        mtlLoader.load('SportsCar.mtl', (mtl) => {
            mtl.preload();
            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }
            objLoader.setMaterials(mtl);

            objLoader.load('SportsCar.obj', (root) => {
                root.position.y = 0.25;
                scene.add(root);
            });
        });
    }


    // Creating the scene with the textures, lights, and OBJ loader before the generated primary shapes
    const scene = new THREE.Scene();
    scene.add(mesh); // Adding the gray checkerboard plane to the scene
    scene.add(directionalLight); // Adding the directional lighting to the scene
    scene.add(directionalLight.target); // Adding the directional lighting to the scene
//    scene.add(helper); // Adding the directional lighting's helper to the scene
    scene.add(ambientLight); // Adding the mild ambient light to the scene
    scene.add(hemisphereLight); // Adding the hemisphere light to the scene

    // Setting the road cubes' values
    const roadCubeWidth = 5;
    const roadCubeHeight = 0.5;
    const roadCubeDepth = 5;
    const roadCubeGeometry = new THREE.BoxGeometry(roadCubeWidth, roadCubeHeight, roadCubeDepth);
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
    // Setting the tetrahedron's values
//    const tetrahedronRadius = 2.5; // Default 1
//    const tetrahedronDetail = 0; // Default 0
    // Setting the vehicle sphere's vlaues
    const cylinderRadiusTop = 1;
    const cylinderRadiusBottom = 1;
    const cylinderHeight = 5;
    const cylinderRadialSegments = 32;
    const cylinderGeometry = new THREE.CylinderGeometry(cylinderRadiusTop, cylinderRadiusBottom, cylinderHeight, cylinderRadialSegments);


    function makeRoadCubeInstance(cubeGeometry, x, y, z, texture) { // Internal function to create a road made up of three cubes stuck together
        const material = new THREE.MeshBasicMaterial({ map: texture }); // Coloring the cubes, which are affected by lights
        const cubes = []; // The return array
        // Cube One, the center cube
        const cubeOne = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        scene.add(cubeOne);
        cubeOne.position.x = x;
        cubeOne.position.y = y;
        cubeOne.position.z = z;
        cubes.push(cubeOne);
        // Cube Two, the left cube
        const cubeTwo = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        scene.add(cubeTwo);
        cubeTwo.position.x = x - 5;
        cubeTwo.position.y = y;
        cubeTwo.position.z = z;
        cubes.push(cubeTwo);
        // Cube Three, the right cube
        const cubeThree = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        scene.add(cubeThree);
        cubeThree.position.x = x + 5;
        cubeThree.position.y = y;
        cubeThree.position.z = z;
        cubes.push(cubeThree);
        return cubes;
        // return [cubeOne, cubeTwo, cubeThree];
    }
    function makeCubeInstance(cubeGeometry, x, y, z, givenTexture) { // Internal function to create cubes
        // const material = new THREE.MeshPhongMaterial({ color }); // Coloring the cube which is affected by lights
        const material = new THREE.MeshBasicMaterial({ map: givenTexture }); // Texturing the cube which is not affected by lights
        const cube = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        scene.add(cube);
        cube.position.x = x;
        cube.position.y = y;
        cube.position.z = z;
        return cube;
    }
    function makeVehicleSphereInstance(sphereGeometry, color, x, y, z) { // Internal function to create spheres to act as tires for a vehicle
        const material = new THREE.MeshPhongMaterial({ color }); // Coloring the sphere which is affected by lights
        const spheres = []; // The return array
        // Sphere One at the top-left
        const sphereOne = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        scene.add(sphereOne);
        sphereOne.position.x = x - 2.5;
        sphereOne.position.y = y;
        sphereOne.position.z = z + 7;
        spheres.push(sphereOne);
        // Sphere Two at the top-right
        const sphereTwo = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        scene.add(sphereTwo);
        sphereTwo.position.x = x + 2.5;
        sphereTwo.position.y = y;
        sphereTwo.position.z = z + 7;
        spheres.push(sphereTwo);
        // Sphere Three at the back-left
        const sphereThree = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        scene.add(sphereThree);
        sphereThree.position.x = x - 2.5;
        sphereThree.position.y = y;
        sphereThree.position.z = z - 7;
        spheres.push(sphereThree);
        // Sphere Four at the back-right
        const sphereFour = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        scene.add(sphereFour);
        sphereFour.position.x = x + 2.5;
        sphereFour.position.y = y;
        sphereFour.position.z = z - 7;
        spheres.push(sphereFour);
        return spheres;
    }
    function makeSphereInstance(sphereGeometry, color, x, y, z) { // Internal function to create spheres
        const material = new THREE.MeshPhongMaterial({ color }); // Coloring the sphere which is affected by lights
        const sphere = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        scene.add(sphere);
        sphere.position.x = x;
        sphere.position.y = y;
        sphere.position.z = z;
        return sphere;
    }
//    function makeTetrahedronInstance(tetrahedronRadius, tetrahedronDetail, color, x) { // Internal function to create tetrahedrons
//        let tetrahedronGeometry = new THREE.TetrahedronGeometry(tetrahedronRadius, tetrahedronDetail);

//        const material = new THREE.MeshBasicMaterial({ color }); // Coloring the tetrahedron which is not affected by lights because it does not have smooth vertex normals
//        const tetrahedron = new THREE.Mesh(tetrahedronGeometry, material); // Creating the mesh for the tetrahedron
//        scene.add(tetrahedron);
//        tetrahedron.position.x = x;
//        tetrahedron.position.y = tetrahedron.position.y + 5;
//        return tetrahedron;
//    }
    function makeCylinderInstance(cylinderGeometry, givenTexture, x, y, z) { // Internal function to create cylinders
        const material = new THREE.MeshBasicMaterial({ map: givenTexture }); // Texturing the cylinder which is not affected by lights
        const cylinder = new THREE.Mesh(cylinderGeometry, material); // Creating the mesh for the cylinder
        scene.add(cylinder);
        cylinder.position.x = x;
        cylinder.position.y = y;
        cylinder.position.z = z;
        return cylinder;
    }

    // Creating the road through road cubes
    const roadCubes = [
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
    
    // Creating the grass on both sides of the road through road cubes
    const grassCubesOne = [
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
    const grassCubesTwo = [
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

    // Creating the black tires for the vehicle through sphere cubes
    const vehicleSpheres = [
        makeVehicleSphereInstance(vehicleSphereGeometry, 0x000000, 0, 1, -15),
    ];

    // Creating the blue body of the vehicle though a normal cube
    const cubes = [
        makeCubeInstance(cubeGeometry, 0, 2, -15, vehicleBodyTexture),
    ];

//    // Creating one textured spinning cube slightly left of the origin
//    const cubes = [
//        makeCubeInstance(cubeGeometry, -5, roadTexture),
//    ];
    // Creating a large Sun
    const spheres = [
        makeSphereInstance(sphereGeometry, 0xFFFF00, -30, 15, -30),
    ];
    // Creating one spinning red tetrahedron slightly right of the origin
//    const tetrahedrons = [
//        makeTetrahedronInstance(tetrahedronRadius, tetrahedronDetail, 0xFF0000, 5),
//    ];

    // Creating one textured cylinder on top of the vehicle
    const vehicleCylinder = [
        makeCylinderInstance(cylinderGeometry, vehicleCylinderTexture, 0, 4, -10),
    ];


    // Rendering the scene
    function resizeRendererToDisplaySize(renderer) { // Internal function to automatically resize the canvas and support high-DPI displays
        const canvas = renderer.domElement;
        const pixelRatio = window.devicePixelRatio;
        const width = Math.floor(canvas.clientWidth * pixelRatio);
        const height = Math.floor(canvas.clientHeight * pixelRatio);
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }
    function render(time) { // Internal function that renders all scene objects
        time *= 0.001;

        // Fix the blockiness of the camera
        if (resizeRendererToDisplaySize(renderer) === true) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        roadCubes.forEach((cubes, ndx) => {
            cubes.forEach((cube) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
//              cube.rotation.x = rot;
//              cube.rotation.y = rot;
            });
        });
        grassCubesOne.forEach((cubes, ndx) => {
            cubes.forEach((cube) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
//              cube.rotation.x = rot;
//              cube.rotation.y = rot;
            });
        });
        grassCubesTwo.forEach((cubes, ndx) => {
            cubes.forEach((cube) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
//              cube.rotation.x = rot;
//              cube.rotation.y = rot;
            });
        });
       cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
//            cube.rotation.x = rot;
//            cube.rotation.y = rot;
        });
        vehicleSpheres.forEach((spheres, ndx) => {
            spheres.forEach((sphere) => {
                const speed = 1 + ndx * .1;
                const rot = time * speed;
                sphere.rotation.x = rot;
                sphere.rotation.y = rot;
            });
        });
//        spheres.forEach((sphere, ndx) => {
//            const speed = 1 + ndx * .1;
//            const rot = time * speed;
//            sphere.rotation.x = rot;
//            sphere.rotation.y = rot;
//        });
//        tetrahedrons.forEach((tetrahedron, ndx) => {
//            const speed = 1 + ndx * .1;
//            const rot = time * speed;
//            tetrahedron.rotation.x = rot;
//            tetrahedron.rotation.y = rot;
//        });
        vehicleCylinder.forEach((cylinders, ndx) => {
//            cylinders.forEach((cylinder) => {
//                const speed = 1 + ndx * .1;
//                const rot = time * speed;
//                cylinder.rotation.x = rot;
//                cylinder.rotation.y = rot;
//            });
        });

        // Creating the texture for the skybox/background with the "Pink Sunrise" Cubemap By Greg Zaal And Rico Cilliers Of Poly Haven
        const loader = new THREE.TextureLoader();
        const bgTexture = loader.load('cubemap.png', () => {
            bgTexture.mapping = THREE.EquirectangularReflectionMapping;
            bgTexture.colorSpace = THREE.SRGBColorSpace;
            scene.background = bgTexture;
        });
        bgTexture.colorspace = THREE.SRGBColorSpace;

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main(); // Running the main() function
