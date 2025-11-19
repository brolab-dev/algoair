#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define DHTPIN 15
#define DHTTYPE DHT22
#define LED_PIN 2
#define MQ135_PIN 34  // Analog pin for MQ-135 gas sensor
#define NOISE_PIN 35  // Analog pin for noise sensor
#define PM25_PIN 32   // Analog pin for PM2.5 sensor
#define PM10_PIN 33   // Analog pin for PM10 sensor

// Function declarations
void sendDataToCloud(float temp, float hum, int gas, int noise, int pm25, int pm10, String status);
int readGasSensor();
int readNoiseSensor();
int readPM25Sensor();
int readPM10Sensor();
int calculateAQI(int pm25, int pm10);

// WiFi credentials (Wokwi WiFi simulation)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Simple HTTP server endpoint
// Use Wokwi gateway to access localhost on host machine
const char* serverUrl = "http://host.wokwi.internal:3000/api/airquality";

// Alternative: Use Firebase (uncomment to use)
// const char* firebaseHost = "https://YOUR-PROJECT-ID.firebaseio.com";
// const char* firebasePath = "/airquality/sensor1.json";
// const char* firebaseAuth = "";

// Use 20 columns and 4 rows for LCD2004
LiquidCrystal_I2C lcd(0x27, 20, 4);
DHT dht(DHTPIN, DHTTYPE);

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 60000; // Send data every 1 minute

void setup() {
  Serial.begin(115200);
  dht.begin();
  lcd.init();
  lcd.backlight();
  pinMode(LED_PIN, OUTPUT);

  lcd.setCursor(0, 0);
  lcd.print("Smart Env System");
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi...");

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    lcd.setCursor(0, 2);
    lcd.print("WiFi: Connected");
    delay(2000);
  } else {
    Serial.println("\nWiFi Connection Failed!");
    lcd.setCursor(0, 2);
    lcd.print("WiFi: Failed");
    delay(2000);
  }

  lcd.clear();
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // Read sensor values from potentiometers (simulating real sensors)
  int gas = readGasSensor();      // MQ-135: 0-1000 ppm
  int noise = readNoiseSensor();  // Noise: 0-120 dB
  int pm25 = readPM25Sensor();    // PM2.5: 0-500 µg/m³
  int pm10 = readPM10Sensor();    // PM10: 0-600 µg/m³

  int aqi = calculateAQI(pm25, pm10);
  String status = "NORMAL";

  // Enhanced threshold logic including PM2.5 and PM10
  if (gas > 700 || noise > 80 || temp > 40.0 || pm25 > 150 || pm10 > 250 || aqi > 200) {
    status = "DANGER";
    digitalWrite(LED_PIN, HIGH);
  } else if ((gas > 500 && gas <= 700) || (noise > 60 && noise <= 80) ||
             (temp > 35.0 && temp <= 40.0) || (pm25 > 55 && pm25 <= 150) ||
             (pm10 > 150 && pm10 <= 250) || (aqi > 100 && aqi <= 200)) {
    status = "WARNING";
    digitalWrite(LED_PIN, HIGH);
  } else {
    status = "NORMAL";
    digitalWrite(LED_PIN, LOW);
  }

  // Display using 4 lines of the 20x4 LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(temp, 1);
  lcd.print("C H:");
  lcd.print(hum, 0);
  lcd.print("% G:");
  lcd.print(gas);

  lcd.setCursor(0, 1);
  lcd.print("PM2.5:");
  lcd.print(pm25);
  lcd.print(" PM10:");
  lcd.print(pm10);

  lcd.setCursor(0, 2);
  lcd.print("AQI:");
  lcd.print(aqi);
  lcd.print(" Noise:");
  lcd.print(noise);
  lcd.print("dB");

  lcd.setCursor(0, 3);
  lcd.print("Status: ");
  lcd.print(status);

  // Serial output for debug
  Serial.println("---------------");
  Serial.print("Temp: "); Serial.print(temp); Serial.println(" °C");
  Serial.print("Hum : "); Serial.print(hum); Serial.println(" %");
  Serial.print("Gas : "); Serial.print(gas); Serial.println(" ppm");
  Serial.print("PM2.5: "); Serial.print(pm25); Serial.println(" µg/m³");
  Serial.print("PM10: "); Serial.print(pm10); Serial.println(" µg/m³");
  Serial.print("AQI : "); Serial.println(aqi);
  Serial.print("Noise: "); Serial.print(noise); Serial.println(" dB");
  Serial.print("Status: "); Serial.println(status);

  // Send data to cloud/mobile app
  if (WiFi.status() == WL_CONNECTED) {
    if (millis() - lastSendTime >= sendInterval) {
      sendDataToCloud(temp, hum, gas, noise, pm25, pm10, status);
      lastSendTime = millis();
    } else {
      Serial.print("Waiting to send... (");
      Serial.print((sendInterval - (millis() - lastSendTime)) / 1000);
      Serial.println(" seconds remaining)");
    }
  } else {
    Serial.println("WiFi not connected!");
  }

  Serial.println("---------------");

  delay(60000); // 1 minute delay between loops
}

void sendDataToCloud(float temp, float hum, int gas, int noise, int pm25, int pm10, String status) {
  HTTPClient http;

  // Create JSON payload
  StaticJsonDocument<400> doc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["gas"] = gas;
  doc["noise"] = noise;
  doc["pm25"] = pm25;
  doc["pm10"] = pm10;
  doc["aqi"] = calculateAQI(pm25, pm10);
  doc["status"] = status;
  doc["timestamp"] = millis();
  doc["deviceId"] = "ESP32_001";

  String jsonString;
  serializeJson(doc, jsonString);

  Serial.println("=== Sending data to server ===");
  Serial.print("Server URL: ");
  Serial.println(serverUrl);
  Serial.print("JSON Payload: ");
  Serial.println(jsonString);

  // Send to custom HTTP server
  Serial.println("Initiating HTTP connection...");
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  Serial.println("Sending POST request...");
  int httpResponseCode = http.POST(jsonString);

  // Alternative: Send to Firebase (uncomment to use)
  // String firebaseUrl = String(firebaseHost) + firebasePath;
  // if (strlen(firebaseAuth) > 0) {
  //   firebaseUrl += "?auth=" + String(firebaseAuth);
  // }
  // http.begin(firebaseUrl);
  // http.addHeader("Content-Type", "application/json");
  // int httpResponseCode = http.PUT(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error sending data. HTTP code: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

// Read MQ-135 gas sensor (simulated with potentiometer)
// Returns: 0-1000 ppm
int readGasSensor() {
  int rawValue = analogRead(MQ135_PIN);  // 0-4095 (12-bit ADC)
  int ppm = map(rawValue, 0, 4095, 0, 1000);  // Convert to 0-1000 ppm
  return ppm;
}

// Read noise sensor (simulated with potentiometer)
// Returns: 0-120 dB
int readNoiseSensor() {
  int rawValue = analogRead(NOISE_PIN);  // 0-4095 (12-bit ADC)
  int dB = map(rawValue, 0, 4095, 0, 120);  // Convert to 0-120 dB
  return dB;
}

// Read PM2.5 sensor (simulated with potentiometer)
// Returns: 0-500 µg/m³
int readPM25Sensor() {
  int rawValue = analogRead(PM25_PIN);  // 0-4095 (12-bit ADC)
  int pm25 = map(rawValue, 0, 4095, 0, 500);  // Convert to 0-500 µg/m³
  return pm25;
}

// Read PM10 sensor (simulated with potentiometer)
// Returns: 0-600 µg/m³
int readPM10Sensor() {
  int rawValue = analogRead(PM10_PIN);  // 0-4095 (12-bit ADC)
  int pm10 = map(rawValue, 0, 4095, 0, 600);  // Convert to 0-600 µg/m³
  return pm10;
}

// Calculate Air Quality Index (AQI) based on PM2.5 and PM10
// Returns: 0-500 AQI value
// Reference: US EPA AQI calculation
int calculateAQI(int pm25, int pm10) {
  int aqi25 = 0;
  int aqi10 = 0;

  // Calculate AQI for PM2.5
  if (pm25 <= 12) {
    aqi25 = map(pm25, 0, 12, 0, 50);
  } else if (pm25 <= 35) {
    aqi25 = map(pm25, 13, 35, 51, 100);
  } else if (pm25 <= 55) {
    aqi25 = map(pm25, 36, 55, 101, 150);
  } else if (pm25 <= 150) {
    aqi25 = map(pm25, 56, 150, 151, 200);
  } else if (pm25 <= 250) {
    aqi25 = map(pm25, 151, 250, 201, 300);
  } else {
    aqi25 = map(pm25, 251, 500, 301, 500);
  }

  // Calculate AQI for PM10
  if (pm10 <= 54) {
    aqi10 = map(pm10, 0, 54, 0, 50);
  } else if (pm10 <= 154) {
    aqi10 = map(pm10, 55, 154, 51, 100);
  } else if (pm10 <= 254) {
    aqi10 = map(pm10, 155, 254, 101, 150);
  } else if (pm10 <= 354) {
    aqi10 = map(pm10, 255, 354, 151, 200);
  } else if (pm10 <= 424) {
    aqi10 = map(pm10, 355, 424, 201, 300);
  } else {
    aqi10 = map(pm10, 425, 600, 301, 500);
  }

  // Return the higher AQI value
  return max(aqi25, aqi10);
}
