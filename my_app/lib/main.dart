import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'CareerCompanion',
      debugShowCheckedModeBanner: false,
      home: WebViewScreen(),
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  HttpServer? _server;
  WebViewController? _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _startLocalServerAndLoad();
  }

  Future<void> _startLocalServerAndLoad() async {
    try {
      // Bind to an ephemeral loopback port
      _server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);

      _server!.listen((HttpRequest request) async {
        String path = request.uri.path;
        if (path == '/' || path.isEmpty) {
          path = '/index.html';
        }

        final assetKey = 'assets/web$path';
        try {
          final byteData = await rootBundle.load(assetKey);
          final bytes = byteData.buffer.asUint8List();

          // Map file extensions to proper MIME types
          String mime = 'text/plain; charset=utf-8';
          if (path.endsWith('.html')) {
            mime = 'text/html; charset=utf-8';
          } else if (path.endsWith('.js') || path.endsWith('.mjs')) {
            mime = 'application/javascript; charset=utf-8';
          } else if (path.endsWith('.css')) {
            mime = 'text/css; charset=utf-8';
          } else if (path.endsWith('.png')) {
            mime = 'image/png';
          } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            mime = 'image/jpeg';
          } else if (path.endsWith('.svg')) {
            mime = 'image/svg+xml';
          } else if (path.endsWith('.json')) {
            mime = 'application/json; charset=utf-8';
          } else if (path.endsWith('.woff2')) {
            mime = 'font/woff2';
          } else if (path.endsWith('.woff')) {
            mime = 'font/woff';
          } else if (path.endsWith('.ttf')) {
            mime = 'font/ttf';
          }

          request.response.headers.set('Content-Type', mime);
          request.response.headers.set('Access-Control-Allow-Origin', '*');
          request.response.add(bytes);
        } catch (_) {
          request.response.statusCode = HttpStatus.notFound;
        }
        await request.response.close();
      });

      final port = _server!.port;
      final url = 'http://127.0.0.1:$port/index.html';

      final controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageFinished: (url) {
              if (mounted) {
                setState(() {
                  _isLoading = false;
                });
              }
            },
            onWebResourceError: (error) {
              debugPrint('WebView resource error: ${error.description}');
            },
          ),
        )
        ..loadRequest(Uri.parse(url));

      if (mounted) {
        setState(() {
          _controller = controller;
        });
      }
    } catch (e) {
      debugPrint('Error starting local asset server: $e');
    }
  }

  @override
  void dispose() {
    _server?.close(force: true);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFDF6F2),
      body: SafeArea(
        child: Stack(
          children: [
            if (_controller != null)
              WebViewWidget(controller: _controller!),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFF7C3AED),
                ),
              ),
          ],
        ),
      ),
    );
  }
}