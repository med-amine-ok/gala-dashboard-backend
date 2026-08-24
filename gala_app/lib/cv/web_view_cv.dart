import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';

class UrlLauncherWidget extends StatefulWidget {
  final String url;
  final String title;
  final bool forceExternalBrowser;

  const UrlLauncherWidget({
    super.key,
    required this.url,
    this.title = 'Web Page',
    this.forceExternalBrowser = false,
  });

  @override
  State<UrlLauncherWidget> createState() => _UrlLauncherWidgetState();
}

class _UrlLauncherWidgetState extends State<UrlLauncherWidget> {
  late final WebViewController _webViewController;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();

    if (!widget.forceExternalBrowser) {
      _webViewController =
          WebViewController()
            ..setJavaScriptMode(JavaScriptMode.unrestricted)
            ..setNavigationDelegate(
              NavigationDelegate(
                onPageStarted: (_) => setState(() => _isLoading = true),
                onPageFinished: (_) => setState(() => _isLoading = false),
              ),
            )
            ..loadRequest(Uri.parse(widget.url));
    }
  }

  Future<void> _launchInBrowser() async {
    final Uri uri = Uri.parse(widget.url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Could not launch ${widget.url}')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body:
          widget.forceExternalBrowser
              ? Center(
                child: ElevatedButton(
                  onPressed: _launchInBrowser,
                  child: const Text('Open Link'),
                ),
              )
              : Stack(
                children: [
                  WebViewWidget(controller: _webViewController),
                  if (_isLoading)
                    const Center(child: CircularProgressIndicator()),
                ],
              ),
    );
  }
}
