from fastapi import HTTPException, status
from schema.summarize_schema import SummarizeInput, SummarizeOutput
from config import Settings
from openai import OpenAI
import json

OPENAI_API_KEY = Settings().OPENAI_API_KEY
client = OpenAI(api_key=OPENAI_API_KEY)

def parse_multiple_json(json_string):
    """
    주어진 문자열에서 여러 개의 JSON 객체를 파싱하여 리스트로 반환합니다.
    """
    decoder = json.JSONDecoder()
    pos = 0
    length = len(json_string)
    objects = []
    
    while pos < length:
        # 공백 문자 건너뛰기
        while pos < length and json_string[pos].isspace():
            pos += 1
        if pos >= length:
            break
        try:
            obj, index = decoder.raw_decode(json_string, pos)
            objects.append(obj)
            pos = index
        except json.JSONDecodeError as e:
            print(f"JSON 디코딩 에러 발생 위치: {pos}")
            print(f"에러 메시지: {e}")
            break
    return objects

async def service_summarize(
    request: SummarizeInput
) -> SummarizeOutput:
    
    # 입력값 검증
    if not request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body is required"
        )

    messages = request.data
    if not messages or len(messages) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid input: messages array is required"
        )

    if not all([message.personId, message.plainText] for message in messages):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="personId, and plainText are required"
        )

    try:
        # 각 메시지를 포맷팅하여 대화 내용 구성
        formatted_messages = []
        for message in messages:
            formatted_message = f"[{message.personId}] {message.plainText}"
            formatted_messages.append(formatted_message)

        summarize_prompt = f"다음 회의록을 요약해 주세요. 대화 순서는 오름차순으로 정렬되어 있습니다.\nText:\"\"\"{chr(10).join(formatted_messages)}\"\"\""

        # OpenAI API 호출 부분
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes conversations."},
                {"role": "user", "content": summarize_prompt}
            ],
            max_tokens=1000,
            temperature=0.5
        )

        # 수정된 응답 처리 부분
        if not completion.choices:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No response from OpenAI"
            )
            
        message_content = completion.choices[0].message.content
        if not message_content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate summary from OpenAI"
            )
        summarized_text = message_content.strip()
 
        alarm_prompt = f"""
        다음 회의록을 분석하여 각 할 일(todo)과 정해진 시간(reserved_time)을 key-value 형식으로 추출해 주세요. 연도와 월이 안주어지면 오늘 날짜를 기준으로 추출해 주세요. 분 단위의 구체적인 시간이 없는 경우는 제외해 주세요.
        분석 결과 일정이 없을 경우, 출력 형식은 다음과 같습니다:
        {{
        "todo": "",
        "reserved_time": ""
        }}

        분석 결과 일정이 있을 경우, 출력 형식은 다음과 같아야 합니다:

        {{
        "todo": "할 일의 내용",
        "reserved_time": "YYYY-MM-DD HH:MM KST"
        }}

        예시:

        회의록:
        - 오늘 오후 3시 프로젝트 보고서 작성
        - 팀 미팅 준비 내일 오전 10시

        출력:
        {{
        "todo": "프로젝트 보고서 작성",
        "reserved_time": "2024-11-09 15:00 KST"
        }}
        {{
        "todo": "팀 미팅 준비",
        "reserved_time": "2024-11-10 10:00 KST"
        }}

        다음 회의록을 이와 같은 형식으로 처리해 주세요:

        Text:
        {chr(10).join(formatted_messages)}
        """

        # OpenAI API 호출 부분
        """completion2 = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that summarizes conversations."},
                {"role": "user", "content": alarm_prompt}
            ],
            max_tokens=150,
            temperature=0.5
        )

        # 수정된 응답 처리 부분
        if not completion2.choices:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No response from OpenAI"
            )
            
        message2_content = completion2.choices[0].message.content
        if not message2_content:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate summary from OpenAI"
            )
        alarmized_text = message2_content.strip()
        # 테스트용 임시 코드
        # summarized_text = prompt
        alarmized_json = parse_multiple_json(alarmized_text)"""

        alarmized_json = [{"todo": "test", "reserved_time": "2024-11-09 15:00 KST"}]

        return SummarizeOutput(
            output=summarized_text,
            alarm=alarmized_json
        )

    except Exception as e:
        error_message = str(e)
        print(f"Summarize function error: {error_message}", {
            "error": error_message,
        })
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarize failed: {error_message}"
        )
