import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import GUI from 'lil-gui';


// Class for lil-gui
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
    // Creating the orbiting camera
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();


    // Creating the gray checkerboard ground plane
    const planeSize = 40;
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
    // Creating the texture for the cube
    const textureLoader = new THREE.TextureLoader();
    const cubeTexture = textureLoader.load('falcon.jpeg'); // The texture is "Falcon Perched On Tree" on Pexels by Frans Van Heerden
    cubeTexture.colorSpace = THREE.SRGBColorSpace;


    // Adding directional lighting to the scene
    const directionalLightColor = 0xFFCC33; // Sunglow at sunset color
    const directionalLightIntensity = 1;
    const directionalLight = new THREE.DirectionalLight(directionalLightColor, directionalLightIntensity);
    directionalLight.position.set(0, 10, 0); // Setting the default position of the light
    // Adding the directional light's helper to the scene for debugging purposes
    const helper = new THREE.DirectionalLightHelper(directionalLight);
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
        helper.update();
    }
    const gui = new GUI();
    // Allowing the user to manipulate the directional lighting and its helper
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
                scene.add(root);
            });
        });
    }


    // Creating the scene with the textures, lights, and OBJ loader before the generated primary shapes
    const scene = new THREE.Scene();
    scene.add(mesh); // Adding the gray checkerboard plane to the scene
    scene.add(directionalLight); // Adding the directional lighting to the scene
    scene.add(directionalLight.target); // Adding the directional lighting to the scene
    scene.add(helper); // Adding the directional lighting's helper to the scene
    scene.add(ambientLight); // Adding the mild ambient light to the scene
    scene.add(hemisphereLight); // Adding the hemisphere light to the scene


    // Setting the cube's values
    const boxWidth = 2; // Default: 1
    const boxHeight = 2; // Default: 1
    const boxDepth = 2; // Default: 1
    const cubeGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth); // Creating the cube
    // Setting the sphere's values
    const sphereRadius = 1; // Default: 1
    const sphereWidthSegments = 32; // Default: 32
    const sphereVerticalSegments = 16; // Default: 16
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, sphereWidthSegments, sphereVerticalSegments); // Creating the sphere
    // Setting the tetrahedron's values
    const tetrahedronRadius = 2.5; // Default 1
    const tetrahedronDetail = 0; // Default 0


    function makeCubeInstance(cubeGeometry, x, texture) { // Internal function to create cubes
        const material = new THREE.MeshBasicMaterial({ map: texture }); // Coloring the cube which is affected by lights
        // const material = new THREE.MeshBasicMaterial({ map: cubeTexture }); // Coloring the cube which is affected by lights
        const cube = new THREE.Mesh(cubeGeometry, material); // Creating the mesh for the cube
        scene.add(cube);
        cube.position.x = x;
        cube.position.y = cube.position.y + 2.5;
        return cube;
    }
    function makeSphereInstance(sphereGeometry, color, x) { // Internal function to create spheres
        const material = new THREE.MeshPhongMaterial({ color }); // Coloring the sphere which is affected by lights
        const sphere = new THREE.Mesh(sphereGeometry, material); // Creating the mesh for the sphere
        scene.add(sphere);
        sphere.position.x = x;
        sphere.position.y = sphere.position.y + 2.5;
        sphere.position.z = sphere.position.z - 5;
        return sphere;
    }
    function makeTetrahedronInstance(tetrahedronRadius, tetrahedronDetail, color, x) { // Internal function to create tetrahedrons
        let tetrahedronGeometry = new THREE.TetrahedronGeometry(tetrahedronRadius, tetrahedronDetail);

        const material = new THREE.MeshBasicMaterial({ color }); // Coloring the tetrahedron which is not affected by lights because it does not have smooth vertex normals
        const tetrahedron = new THREE.Mesh(tetrahedronGeometry, material); // Creating the mesh for the tetrahedron
        scene.add(tetrahedron);
        tetrahedron.position.x = x;
        tetrahedron.position.y = tetrahedron.position.y + 5;
        return tetrahedron;
    }


    // Creating a skybox and one textured spinning cube slightly left of the origin
    const cubes = [
        makeCubeInstance(cubeGeometry, -5, cubeTexture),
    ];
    // Creating one spinning green sphere at the origin
    const spheres = [
        makeSphereInstance(sphereGeometry, 0x00FF00, 0),
    ];
    // Creating one spinning red tetrahedron slightly right of the origin
    const tetrahedrons = [
        makeTetrahedronInstance(tetrahedronRadius, tetrahedronDetail, 0xFF0000, 5),
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

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });
        spheres.forEach((sphere, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            sphere.rotation.x = rot;
            sphere.rotation.y = rot;
        });
        tetrahedrons.forEach((tetrahedron, ndx) => {
            const speed = 1 + ndx * .1;
            const rot = time * speed;
            tetrahedron.rotation.x = rot;
            tetrahedron.rotation.y = rot;
        });
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main(); // Running the main() function