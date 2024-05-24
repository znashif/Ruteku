var map;
var platform;
var defaultLayers;
var mapObjects = [];
let jmlhToko = 1;
let i = 1;

class Point {
  constructor(name, latitude, longitude) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

const addShopBtn = document.getElementById("addShopBtn");
const removeShopBtn = document.getElementById("removeShopBtn");
const shopInputsContainer = document.getElementById("shopInputs");
const extraShopInputsContainer = document.getElementById("extraShopInputs");

addShopBtn.addEventListener("click", function () {
  if (extraShopInputsContainer.children.length < 9) {
    // Maksimal 7 input tambahan
    const newShopInput = document.createElement("div");
    newShopInput.classList.add("mb-3");
    const index = extraShopInputsContainer.children.length + 2;
    newShopInput.innerHTML = `
      <label class="form-label" id="shopLabel${index}">Koordinat Toko ${index}</label>
      <input type="text" class="form-control shopInput" id="shopInput${index}" placeholder="Misal: -6.200000, 106.816666" />
    `;
    extraShopInputsContainer.appendChild(newShopInput);
    jmlhToko++;

    // Nonaktifkan tombol "Tambah Toko" jika sudah mencapai 10 input
    if (extraShopInputsContainer.children.length === 9) {
      addShopBtn.disabled = true;
    }
  }
});

removeShopBtn.addEventListener("click", function () {
  if (extraShopInputsContainer.children.length > 0) {
    extraShopInputsContainer.removeChild(extraShopInputsContainer.lastChild);
    jmlhToko--;

    // Aktifkan kembali tombol "Tambah Toko" jika sudah tidak mencapai 10 input
    addShopBtn.disabled = false;
  }
});

// Fungsi untuk menampilkan peta dan marker
function showRoute(warehouse, shops, clearMap = true) {
  if (!map) {
    platform = new H.service.Platform({
      apikey: "eCFIuX0hJvq0hPXzdNV1scHOfBcIQvTRtEIVwuCPHy0",
    });
    defaultLayers = platform.createDefaultLayers();
    map = new H.Map(
      document.getElementById("map"),
      defaultLayers.vector.normal.map,
      {
        zoom: 5, // Zoom yang lebih rendah agar menampilkan seluruh Indonesia
        center: { lat: -0.789275, lng: 113.921327 }, // Koordinat tengah Indonesia
      }
    );

    // Enable the event system on the map instance:
    var mapEvents = new H.mapevents.MapEvents(map);

    // Instantiate the default behavior, providing the mapEvents object:
    new H.mapevents.Behavior(mapEvents);

    // Create the default UI components:
    H.ui.UI.createDefault(map, defaultLayers);
  }

  // Clear existing markers if clearMap is true
  if (clearMap) {
    mapObjects.forEach((marker) => map.removeObject(marker));
    mapObjects = [];
  }

  // Jika tidak ada koordinat yang dimasukkan, hanya tampilkan peta Indonesia
  if (!warehouse || !shops.every((shop) => shop.latitude && shop.longitude)) {
    map.setCenter({ lat: -0.789275, lng: 113.921327 });
    map.setZoom(5);
    return;
  }

  // Menampilkan marker gudang
  // Membuat ikon kustom dengan warna yang diinginkan untuk marker gudang
const warehouseIcon = new H.map.Icon(
  '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="blue" d="M12 2c-3.31 0-6 2.69-6 6 0 3.86 6 14 6 14s6-10.14 6-14c0-3.31-2.69-6-6-6zm0 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
);
  // Membuat marker gudang dengan ikon kustom
const warehouseMarker = new H.map.Marker(
  { lat: warehouse.latitude, lng: warehouse.longitude },
  { icon: warehouseIcon }
);
  warehouseMarker.setData("Gudang");
  map.addObject(warehouseMarker);
  mapObjects.push(warehouseMarker);

  // Menampilkan marker toko-toko
  shops.forEach((shop, index) => {
    var shopMarker = new H.map.Marker({
      lat: shop.latitude,
      lng: shop.longitude,
    });
    shopMarker.setData(`Toko ${index + 1}`);
    map.addObject(shopMarker);
    mapObjects.push(shopMarker);
  });

  // Center the map around the warehouse
  map.setCenter({ lat: warehouse.latitude, lng: warehouse.longitude });
  map.setZoom(15); // Zoom lebih dekat
}

// Panggil fungsi showRoute saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  showRoute();
});

document
  .getElementById("coordinateForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault();

    console.log(jmlhToko);
    const warehouseInput = document
      .getElementById("warehouseInput")
      .value.split(",")
      .map(Number);

    const shopInputs = [];
    for (let i = 1; i <= jmlhToko; i++) {
      const shopInput = document
        .getElementById(`shopInput${i}`)
        .value.split(",")
        .map(Number);
      shopInputs.push(shopInput);
    }

    const warehouse = new Point(
      "Warehouse",
      warehouseInput[0],
      warehouseInput[1]
    );

    const shopPoints = [];
    // Looping sebanyak jumlah toko untuk membuat objek Point-nya
    for (let i = 1; i <= jmlhToko; i++) {
      const shopInput = document
        .getElementById(`shopInput${i}`)
        .value.split(",")
        .map(Number);
      const shopPoint = new Point(`Shop ${i}`, shopInput[0], shopInput[1]);
      shopPoints.push(shopPoint);
    }

    console.log("Warehouse:", warehouse);
    // Menampilkan objek Point dari setiap toko
    shopPoints.forEach((shop, index) => {
      console.log(`Shop ${index + 1}:`, shop);
    });

    // Tampilkan peta dengan koordinat yang diberikan
    showRoute(warehouse, shopPoints);

    // Panggil fungsi bruteForceTSP dan tampilkan hasilnya di konsol
    const locations = {};

    // Tambahkan gudang sebagai lokasi pertama
    locations["Warehouse"] = warehouse;

    // Tambahkan setiap toko ke dalam objek lokasi
    for (let i = 1; i <= jmlhToko; i++) {
      locations[`Shop ${i}`] = new Point(
        `Shop ${i}`,
        shopInputs[i - 1][0],
        shopInputs[i - 1][1]
      );
    }

    const bruteforceResult = await bruteForceTSP(locations);
    console.log("Brute Force Result:", bruteforceResult);
    // Masukkan hasil perhitungan ke dalam elemen HTML
    document.getElementById("bruteforceTime").textContent =
      bruteforceResult.executionTime.toFixed(2) + " ms";
    document.getElementById("bruteforceRoute").textContent =
      bruteforceResult.formattedRoute;
    document.getElementById("bruteforceDistance").textContent =
      bruteforceResult.minDistance.toFixed(2);

    const branchAndBoundResult = await bruteForceTSP(locations);
    console.log("Branch and Bound Result:", branchAndBoundResult);
    // Masukkan hasil perhitungan branch and bound ke dalam elemen HTML
    document.getElementById("branchboundTime").textContent =
      branchAndBoundResult.executionTime.toFixed(2) + " ms";
    document.getElementById("branchboundRoute").textContent =
      branchAndBoundResult.formattedRoute;
    document.getElementById("branchboundDistance").textContent =
      branchAndBoundResult.minDistance.toFixed(2);
  });

// Fungsi untuk menghitung jarak antara dua lokasi menggunakan OpenStreetMap API
async function calculateDistance(location1, location2) {
  const url = `https://router.project-osrm.org/route/v1/driving/${location1.longitude},${location1.latitude};${location2.longitude},${location2.latitude}?overview=false&steps=true&geometries=geojson`;
  const response = await fetch(url);
  if (response.ok) {
    const data = await response.json();
    const distance = data.routes[0].distance / 1000; // Konversi jarak dari meter ke kilometer
    return distance;
  } else {
    throw new Error("Failed to calculate distance");
  }
}

// Fungsi untuk mengeksekusi perhitungan brute force
async function bruteForceTSP(locations) {
  const startTime = performance.now(); // Waktu awal eksekusi

  // Menyiapkan daftar toko
  const shops = Object.values(locations).filter(
    (location) => location.name !== "Warehouse"
  );

  let minDistance = Infinity;
  let optimalRoute = null;

  // Permutasi semua kemungkinan rute
  const permutations = permute(shops);
  for (const permutation of permutations) {
    let distance = 0;
    let currentLocation = locations["Warehouse"];
    for (const nextLocation of permutation) {
      distance += await calculateDistance(currentLocation, nextLocation);
      currentLocation = nextLocation;
    }
    distance += await calculateDistance(
      currentLocation,
      locations["Warehouse"]
    );

    if (distance < minDistance) {
      minDistance = distance;
      optimalRoute = [
        "Warehouse",
        ...permutation.map((location) => location.name),
        "Warehouse",
      ];
    }
  }

  const endTime = performance.now(); // Waktu akhir eksekusi
  const executionTime = endTime - startTime; // Waktu eksekusi dalam milidetik

  const formattedRoute = optimalRoute.join(" - ");
  return { minDistance, formattedRoute, executionTime, optimalRoute };
}

// Fungsi untuk menghasilkan semua permutasi
function permute(locations) {
  const result = [];
  const visited = new Set();

  function dfs(path) {
    if (path.length === locations.length) {
      result.push([...path]);
      return;
    }

    for (const location of locations) {
      if (!visited.has(location)) {
        visited.add(location);
        path.push(location);
        dfs(path);
        path.pop();
        visited.delete(location);
      }
    }
  }

  dfs([]);
  return result;
}

// Fungsi untuk mengeksekusi perhitungan Branch and Bound
async function branchAndBoundTSP(locations) {
  const startTime = performance.now(); // Waktu awal eksekusi

  // Menyiapkan daftar toko
  const shops = Object.values(locations).filter(
    (location) => location.name !== "Warehouse"
  );

  let minDistance = Infinity;
  let optimalRoute = null;

  // Inisialisasi daftar node yang akan dieksplorasi
  const initialNode = {
    currentLocation: locations["Warehouse"],
    remainingLocations: shops,
    path: ["Warehouse"],
    distance: 0,
  };

  const nodesToExplore = [initialNode];

  // Fungsi untuk menghitung lower bound dari sebuah node
  function calculateLowerBound(node) {
    let lowerBound = node.distance;

    // Menambahkan jarak minimum dari node saat ini ke node berikutnya
    lowerBound += node.remainingLocations.reduce((min, location) => {
      const distanceToLocation = calculateDistance(
        node.currentLocation,
        location
      );
      return Math.min(min, distanceToLocation);
    }, 0);

    return lowerBound;
  }

  // Iteratif mencari solusi optimal menggunakan Branch and Bound
  while (nodesToExplore.length > 0) {
    // Mengambil node dengan lower bound terkecil dari daftar nodes yang akan dieksplorasi
    const currentNode = nodesToExplore.pop();

    // Jika lower bound dari node saat ini lebih besar dari minimum distance yang sudah ditemukan, skip node ini
    if (calculateLowerBound(currentNode) >= minDistance) continue;

    // Jika semua toko telah dikunjungi, cek apakah rute ini lebih pendek dari yang sudah ada
    if (currentNode.remainingLocations.length === 0) {
      const distanceToWarehouse = await calculateDistance(
        currentNode.currentLocation,
        locations["Warehouse"]
      );
      const totalDistance = currentNode.distance + distanceToWarehouse;
      if (totalDistance < minDistance) {
        minDistance = totalDistance;
        optimalRoute = [...currentNode.path, "Warehouse"];
      }
    } else {
      // Jika masih ada toko yang harus dikunjungi, tambahkan node-node anaknya ke daftar nodes yang akan dieksplorasi
      const sortedLocations = currentNode.remainingLocations
        .slice()
        .sort((a, b) => {
          const distanceA = calculateDistance(currentNode.currentLocation, a);
          const distanceB = calculateDistance(currentNode.currentLocation, b);
          return distanceA - distanceB;
        });

      for (const nextLocation of sortedLocations) {
        const distanceToNextLocation = await calculateDistance(
          currentNode.currentLocation,
          nextLocation
        );
        const nextNode = {
          currentLocation: nextLocation,
          remainingLocations: currentNode.remainingLocations.filter(
            (location) => location !== nextLocation
          ),
          path: [...currentNode.path, nextLocation.name],
          distance: currentNode.distance + distanceToNextLocation,
        };
        nodesToExplore.push(nextNode);
      }
    }
  }

  const endTime = performance.now(); // Waktu akhir eksekusi
  const executionTime = endTime - startTime; // Waktu eksekusi dalam milidetik

  const formattedRoute = optimalRoute
    ? optimalRoute.join(" - ")
    : "Tidak ada rute yang ditemukan";

  return { minDistance, formattedRoute, executionTime, optimalRoute };
}

// Tampilkan rute
document.getElementById("bruteforceBtn").addEventListener("click", async function () {
  // Inisialisasi platform HERE
  var platform = new H.service.Platform({
    apikey: window.apikey,
  });
  
  // Mendapatkan nilai koordinat gudang dari input form
  const warehouseInput = document
    .getElementById("warehouseInput")
    .value.split(",")
    .map(Number);
  
  // Membuat objek Point untuk gudang
  const warehouse = new Point(
    "Warehouse",
    warehouseInput[0],
    warehouseInput[1]
  );

  // Mendapatkan jumlah toko dari input user
  const jmlhToko = extraShopInputsContainer.children.length+1;

  // Definisikan objek locations untuk menyimpan lokasi gudang dan toko-toko
  const locations = { Warehouse: warehouse };

  // Mendapatkan nilai koordinat toko dari input form dan membuat objek Point untuk setiap toko
  for (let i = 1; i <= jmlhToko; i++) {
    const shopInput = document.getElementById(`shopInput${i}`).value.split(",").map(Number);
    const shop = new Point(`Shop ${i}`, shopInput[0], shopInput[1]);
    locations[`Shop ${i}`] = shop;
  }

  // Panggil fungsi bruteForceTSP dan dapatkan hasil optimal route
  const bruteforceResult = await bruteForceTSP(locations);
  const optimalRoute = bruteforceResult.optimalRoute;

  // Menggunakan urutan rute dari hasil bruteForceTSP untuk memanggil calculateRouteFromAtoB
  for (let i = 0; i < optimalRoute.length - 1; i++) {
    const startPoint = locations[optimalRoute[i]];
    const endPoint = locations[optimalRoute[i + 1]];
    calculateRouteFromAtoB(
      platform,
      startPoint,
      endPoint,
      onSuccess,
      onError
    );
  }

  console.log("Menampilkan rute dari algoritma Brute Force");
});



document.getElementById("branchboundBtn").addEventListener("click", async function () {
  // Inisialisasi platform HERE
  var platform = new H.service.Platform({
    apikey: window.apikey,
  });
  
  // Mendapatkan nilai koordinat gudang dari input form
  const warehouseInput = document
    .getElementById("warehouseInput")
    .value.split(",")
    .map(Number);
  
  // Membuat objek Point untuk gudang
  const warehouse = new Point(
    "Warehouse",
    warehouseInput[0],
    warehouseInput[1]
  );

  // Mendapatkan jumlah toko dari input user
  const jmlhToko = extraShopInputsContainer.children.length+1;

  // Definisikan objek locations untuk menyimpan lokasi gudang dan toko-toko
  const locations = { Warehouse: warehouse };

  // Mendapatkan nilai koordinat toko dari input form dan membuat objek Point untuk setiap toko
  for (let i = 1; i <= jmlhToko; i++) {
    const shopInput = document.getElementById(`shopInput${i}`).value.split(",").map(Number);
    const shop = new Point(`Shop ${i}`, shopInput[0], shopInput[1]);
    locations[`Shop ${i}`] = shop;
  }

  // Panggil fungsi branchAndBoundTSP dan dapatkan hasil optimal route
  const branchAndBoundResult = await branchAndBoundTSP(locations);
  const optimalRoute = branchAndBoundResult.optimalRoute;

  // Menggunakan urutan rute dari hasil branchAndBoundTSP untuk memanggil calculateRouteFromAtoB
  for (let i = 0; i < optimalRoute.length - 1; i++) {
    const startPoint = locations[optimalRoute[i]];
    const endPoint = locations[optimalRoute[i + 1]];
    calculateRouteFromAtoB(
      platform,
      startPoint,
      endPoint,
      onSuccess,
      onError
    );
  }

  console.log("Menampilkan rute dari algoritma Branch and Bound");
});


// Function untuk rute
function onSuccess(result) {
  var route = result.routes[0];
  addRouteShapeToMap(route);
}

function onError(error) {
  alert("Can't reach the remote server");
}

function addRouteShapeToMap(route) {
  route.sections.forEach((section) => {
    // decode LineString from the flexible polyline
    let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

    // Create a polyline to display the route:
    let polyline = new H.map.Polyline(linestring, {
      style: {
        lineWidth: 4,
        strokeColor: "rgba(0, 128, 255, 0.7)",
      },
    });

    // Add the polyline to the map
    map.addObject(polyline);
    // Restore zoom level and center position
    map.setZoom(currentZoom);
    map.setCenter(currentCenter);
  });
}

function calculateRouteFromAtoB(
  platform,
  startPoint,
  endPoint,
  successCallback,
  errorCallback
) {
  var router = platform.getRoutingService(null, 8),
    routeRequestParams = {
      routingMode: "fast",
      transportMode: "car",
      return: "polyline,turnByTurnActions,actions,instructions,travelSummary",
      origin: `${startPoint.latitude},${startPoint.longitude}`,
      destination: `${endPoint.latitude},${endPoint.longitude}`,
    };

  // Calculate the route
  router.calculateRoute(routeRequestParams, successCallback, errorCallback);
}

// Active Button
function highlightButton(buttonId) {
  // Dapatkan semua tombol
  const buttons = document.querySelectorAll(".btn-primary");

  // Loop melalui tombol dan hapus kelas 'active' jika ada
  buttons.forEach((button) => {
    button.classList.remove("active");
  });

  // Tambahkan kelas 'active' ke tombol yang sedang ditekan
  document.getElementById(buttonId).classList.add("active");
}
