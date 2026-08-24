import 'dart:developer';

import 'package:dio/dio.dart';

abstract class Failure implements Exception {
  final String errMessage;

  const Failure(this.errMessage);

  @override
  String toString() => errMessage;
}

class ServerFailure extends Failure {
  const ServerFailure(super.errMessage);

  factory ServerFailure.fromDioError(DioException dioError) {
    switch (dioError.type) {
      case DioExceptionType.connectionTimeout:
        return const ServerFailure('Connection timeout with ApiServer');

      case DioExceptionType.sendTimeout:
        return const ServerFailure('Send timeout with ApiServer');

      case DioExceptionType.receiveTimeout:
        return const ServerFailure('Receive timeout with ApiServer');

      case DioExceptionType.badResponse:
        log('DioExceptionType.badResponse: $dioError');
        final statusCode = dioError.response?.statusCode;
        final data = dioError.response?.data;
        return ServerFailure.fromResponse(statusCode, data);

      case DioExceptionType.cancel:
        return const ServerFailure('Request to ApiServer was cancelled');

      case DioExceptionType.unknown:
        final msg = dioError.message ?? '';
        if (msg.contains('SocketException')) {
          return const ServerFailure('No Internet Connection');
        }
        return const ServerFailure('Unexpected Error, Please try again!');

      default:
        return const ServerFailure(
          'Oops! There was an error, Please try again',
        );
    }
  }

  factory ServerFailure.fromResponse(int? statusCode, dynamic response) {
    if (statusCode == null) {
      return const ServerFailure('Unknown error, no status code');
    }

    if (statusCode == 400 || statusCode == 401 || statusCode == 403) {
      if (response is Map) {
        log('Error response: $response');
        // DRF-style non_field_errors
        if (response.containsKey('non_field_errors')) {
          final errors = response['non_field_errors'];
          if (errors is List && errors.isNotEmpty) {
            return ServerFailure(errors[0].toString());
          }
        }
      }
      // Defensive parsing: try to extract meaningful message
      final message =
          response is Map<String, dynamic>
              ? (response['error'] ??
                  response['non_field_errors'].join('') ??
                  response['message'] ??
                  'Unauthorized request')
              : 'Unauthorized request';
      return ServerFailure(message);
    } else if (statusCode == 404) {
      return const ServerFailure('Your request not found, Please try later!');
    } else if (statusCode == 500) {
      return const ServerFailure('Internal Server error, Please try later');
    } else {
      return const ServerFailure('Oops! There was an error, Please try again');
    }
  }
}
